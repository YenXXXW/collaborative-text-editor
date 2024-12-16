package main

import (
	"errors"
	"log"
	"net/http"
	"sync"

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
}

func (rm *RoomManager) JoinRoom(roomId string, client *Client) {
	rm.Mutex.Lock()
	defer rm.Mutex.Unlock()

	if rm.Rooms[roomId] == nil {
		rm.Rooms[roomId] = make(map[*Client]bool)
	}

	rm.Rooms[roomId][client] = true
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

func NewRoomManager() *RoomManager {
	return &RoomManager{
		Rooms: make(map[string]map[*Client]bool),
	}
}

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
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		app.internalServerError(w, r, err)
		log.Println(err)
		return
	}

	roomID := r.URL.Query().Get("roomID")
	if roomID == "" {
		err := errors.New("Room Id is required")
		app.internalServerError(w, r, err)
		conn.Close()
	}

	client := &Client{
		Conn:   conn,
		RoomId: roomID,
		Send:   make(chan []byte),
	}

}
