package main

import (
	"errors"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/yenxxxw/collaborative-text-editor/internal/store"
)

type CreateRoomPayload struct {
	UsersInRoom []int64 `json:"users_in_room"`
	CeatorId    int64   `json:"creator_id"`
}

type Client struct {
	Conn   *websocket.Conn
	RoomId string
	Send   chan []byte
}

type RoomManager struct {
	Rooms map[string]map[*Client]bool
	Mutex sync.Mutex
	App   application
}

func (rm *RoomManager) JoinRoom(roomId string, client *Client) {
	rm.Mutex.Lock()
	defer rm.Mutex.Unlock()

	if rm.Rooms[roomId] == nil {
		rm.Rooms[roomId] = make(map[*Client]bool)
	}

	rm.Rooms[roomId][client] = true
}

func (app *application) checkRoom(w http.ResponseWriter, r *http.Request, rooomId string) bool {
	ctx := r.Context()
	exits, err := app.store.Rooms.CheckRoom(ctx, rooomId)

	if err != nil {
		app.internalServerError(w, r, err)
	}

	return exits

}

func (rm *RoomManager) LeaveRoom(roomId string, client *Client) {
	rm.Mutex.Lock()
	defer rm.Mutex.Unlock()

	if clients, ok := rm.Rooms[roomId]; ok {
		delete(clients, client)
		if len(clients) == 0 {
			delete(rm.Rooms, roomId)
		}
	}
}

func (rm *RoomManager) BroadcastToRoom(roomId string, message []byte) {
	rm.Mutex.Lock()
	defer rm.Mutex.Unlock()

	if clients, ok := rm.Rooms[roomId]; ok {
		for client := range clients {
			select {
			case client.Send <- message:

			default:
				rm.LeaveRoom(roomId, client)
			}
		}
	}
}

func NewRoomManager() *RoomManager {
	return &RoomManager{
		Rooms: make(map[string]map[*Client]bool),
	}
}

var roomManager = NewRoomManager()

var upgrader = websocket.Upgrader{
	WriteBufferSize: 1024,
	ReadBufferSize:  1024,
}

func (app *application) createRoomHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreateRoomPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	room := &store.Room{
		UsersInRoom: payload.UsersInRoom,
		CeatorId:    payload.CeatorId,
	}

	ctx := r.Context()

	var createdRoom *store.Room
	var err error

	if createdRoom, err = app.store.Rooms.Create(ctx, room); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	program := &store.Program{
		RoomId:   createdRoom.ID,
		Language: "js",
		Code:     "write something...",
	}

	if err := app.store.Programs.Create(ctx, program); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, room); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

func (app *application) joinRoomHandler(w http.ResponseWriter, r *http.Request) {

	roomID := r.URL.Query().Get("roomID")

	if roomID == "" {
		err := errors.New("Room Id is required")
		app.badRequestResponse(w, r, err)
		return
	}

	exists, err := app.store.Rooms.CheckRoom(r.Context(), roomID)

	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if !exists {
		app.badRequestResponse(w, r, errors.New("Room does not exists"))
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		app.internalServerError(w, r, err)
		log.Println(err)
		return
	}

	client := &Client{
		Conn:   conn,
		RoomId: roomID,
		Send:   make(chan []byte),
	}

	roomManager.JoinRoom(roomID, client)

	go handleClientWrites(client)
	go handleClientReads(client)
}

func handleClientReads(client *Client) {

	defer func() {
		roomManager.LeaveRoom(client.RoomId, client)
		client.Conn.Close()
	}()

	client.Conn.SetReadLimit(maxMessageSize)
	client.Conn.SetReadDeadline(time.Now().Add(pongWait))
	client.Conn.SetPongHandler(func(string) error {
		client.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := client.Conn.ReadMessage()
		if err != nil {
			log.Printf("Error reading message: %v", err)
			break
		}

		roomManager.BroadcastToRoom(client.RoomId, message)
	}

}

func handleClientWrites(client *Client) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.Send:
			client.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			err := client.Conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Printf("Error writing message: %v", err)
				return
			}

		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
