package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	//"github.com/yenxxxw/collaborative-text-editor/internal/store"
)

type CreateRoomPayload struct {
	UsersInRoom []string `json:"users_in_room"`
	CreatorId   string   `json:"creator_id"`
	CreatorName string   `json:"creator_name"`
}

type Client struct {
	UserId   string
	UserName string
	Conn     *websocket.Conn
	RoomId   string
	Send     chan []byte
}

type Room struct {
	Program  string
	Language string
	Clients  map[*Client]bool
}

type RoomManager struct {
	Rooms map[string]*Room
	Mutex sync.Mutex
	App   application
}

type ChangeType string

const (
	InitChange   ChangeType = "init"
	UpdateChange ChangeType = "update"
)

type Change struct {
	StartLineNumber int    `json:"startLineNumber"`
	EndLineNumber   int    `json:"endLineNumber"`
	StartColumn     int    `json:"startColumn"`
	EndColumn       int    `json:"endColumn"`
	Text            string `json:"text"`
	RangeLength     int    `json:"rangeLength"`
}

type User struct {
	UserId   string `json:"userId"`
	UserName string `json:"userName"`
}

type Message struct {
	RoomId      string     `json:"roomId"`
	Change      *Change    `json:"change"`
	Type        ChangeType `json:"type"`
	UserId      string     `json:"userId"`
	Program     *string    `json:"program,omitempty"`
	Language    *string    `json:"language,omitempty"`
	Event       *string    `json:"event,omitempty"`
	UsersInRoom []User     `json:"usersInRoom,omitempty"`
}

func CreateRoom(client *Client) *Room {
	return &Room{
		Program:  "// some comments",
		Clients:  make(map[*Client]bool),
		Language: "javascript",
	}
}

func (rm *RoomManager) JoinRoom(roomId string, client *Client) {
	rm.Mutex.Lock()
	defer rm.Mutex.Unlock()

	if rm.Rooms[roomId] == nil {
		rm.Rooms[roomId] = CreateRoom(client)
	}

	rm.Rooms[roomId].Clients[client] = true
}

func (rm *RoomManager) checkRoom(rooomId string) bool {
	return rm.Rooms[rooomId] != nil
}

func (rm *RoomManager) LeaveRoom(roomId string, client *Client) {
	rm.Mutex.Lock()
	defer rm.Mutex.Unlock()

	room, ok := rm.Rooms[roomId]

	if !ok {
		return
	}

	delete(room.Clients, client)

	if len(room.Clients) == 0 {
		delete(rm.Rooms, roomId)
	}
}

func (rm *RoomManager) BroadcastToRoom(roomId string, message []byte) {
	rm.Mutex.Lock()
	defer rm.Mutex.Unlock()

	if room, ok := rm.Rooms[roomId]; ok {
		for client := range room.Clients {
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
		Rooms: make(map[string]*Room),
	}
}

var roomManager = NewRoomManager()

var upgrader = websocket.Upgrader{
	WriteBufferSize: 1024,
	ReadBufferSize:  1024,
	CheckOrigin: func(r *http.Request) bool {

		origin := r.Header.Get("Origin")
		return origin == os.Getenv("ALLOWED_LOCAL_ORIGIN") || origin == os.Getenv("ALLOWED_DEPLOYED_ORIGIN")
	},
}

func pointerToString(s string) *string {
	return &s
}

func (app *application) joinRoomHandler(w http.ResponseWriter, r *http.Request) {
	roomId := r.URL.Query().Get("roomId")
	userId := r.URL.Query().Get("userId")
	username := r.URL.Query().Get("username")

	if roomId == "" {
		err := errors.New("room Id is required")
		app.badRequestResponse(w, r, err)
		return
	}

	if userId == "" {
		err := errors.New("user Id is required")
		app.badRequestResponse(w, r, err)
		return
	}

	if username == "" {
		err := errors.New("username is required")
		app.badRequestResponse(w, r, err)
		return
	}

	exists := roomManager.checkRoom(roomId)

	if !exists {
		app.badRequestResponse(w, r, errors.New("room does not exists"))
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		app.internalServerError(w, r, err)
		log.Println(err)
		return
	}

	client := &Client{
		UserId:   userId,
		UserName: username,
		Conn:     conn,
		RoomId:   roomId,
		Send:     make(chan []byte),
	}

	roomManager.JoinRoom(roomId, client)

	go handleClientWrites(client)
	go handleClientReads(client)

	room := roomManager.Rooms[roomId]

	var initMessage = Message{
		RoomId:   roomId,
		Change:   nil,
		Type:     InitChange,
		UserId:   userId,
		Program:  &room.Program,
		Language: &room.Language,
	}

	message, err := json.Marshal(initMessage)
	if err != nil {
		log.Println("Error marshaling initial program:", err)
		return
	}

	client.Send <- message

}

func applyChange(program string, change *Change) string {
	lines := strings.Split(program, "\n")

	startLineIdx := change.StartLineNumber - 1
	endLineIdx := change.EndLineNumber - 1

	// Ensure the indices are within bounds
	if startLineIdx >= len(lines) {
		return program
	}

	// Deletion case: Remove characters or lines
	if change.Text == "" && change.RangeLength > 0 {
		if startLineIdx == endLineIdx { // Deleting within a single line
			line := lines[startLineIdx]
			if change.StartColumn-1 < len(line) {
				lines[startLineIdx] = line[:change.StartColumn-1] + line[change.EndColumn-1:]
			}
		} else { // Deleting multiple lines
			lines[startLineIdx] = lines[startLineIdx][:change.StartColumn-1] // Keep start part
			lines[endLineIdx] = lines[endLineIdx][change.EndColumn-1:]       // Keep end part
			lines = append(lines[:startLineIdx+1], lines[endLineIdx+1:]...)  // Remove in-between lines
		}
	} else { // Normal text insertion or replacement
		if startLineIdx == endLineIdx { // Single-line change
			line := lines[startLineIdx]
			if change.StartColumn-1 > len(line) {
				line += strings.Repeat(" ", change.StartColumn-1-len(line))
			}
			lines[startLineIdx] = line[:change.StartColumn-1] + change.Text + line[change.EndColumn-1:]
		} else { // Multi-line change
			startLine := lines[startLineIdx][:change.StartColumn-1] + change.Text
			lines[startLineIdx] = startLine
			lines[endLineIdx] = lines[endLineIdx][change.EndColumn-1:]
		}
	}

	return strings.Join(lines, "\n")
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

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Error unmarshalling message: %v", err)
			break
		}

		roomManager.Mutex.Lock()
		room, ok := roomManager.Rooms[client.RoomId]
		if ok {
			if msg.Change != nil {
				room.Program = applyChange(room.Program, msg.Change)
			}
			if msg.Event != nil && (*msg.Event == "new_user_joined" || *msg.Event == "user_rejoin") {
				var usersInRoom []User
				for client := range room.Clients {
					usersInRoom = append(usersInRoom, User{
						UserId:   client.UserId,
						UserName: client.UserName,
					})
				}
				msg.UsersInRoom = usersInRoom
			}
			if msg.Event != nil && *msg.Event == "user_leave" {

				var usersInRoom []User

				delete(room.Clients, client)
				for client := range room.Clients {
					usersInRoom = append(usersInRoom, User{
						UserId:   client.UserId,
						UserName: client.UserName,
					})

				}
				msg.UsersInRoom = usersInRoom

			}

			if msg.Event != nil && *msg.Event == "new_program" {
				room.Program = "//some_comment"
			}

			if msg.Event != nil && *msg.Event == "lang_change" {
				room.Language = *msg.Language

			}
		}
		jsonMsg, err := json.Marshal(msg)
		if err != nil {
			log.Printf("Error marshalling message: %v", err)
			continue
		}
		roomManager.Mutex.Unlock()
		roomManager.BroadcastToRoom(client.RoomId, jsonMsg)
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

func (app *application) createRoomHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreateRoomPayload

	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if payload.CreatorId == "" {
		app.badRequestResponse(w, r, errors.New("creator_id is required"))
		return
	}

	if payload.CreatorName == "" {
		app.badRequestResponse(w, r, errors.New("creator name is required"))
	}

	roomID := generateRoomID()

	client := &Client{
		UserId:   payload.CreatorId,
		UserName: payload.CreatorName,
		RoomId:   roomID,
		Send:     make(chan []byte),
	}

	room := CreateRoom(client)

	roomManager.Mutex.Lock()
	roomManager.Rooms[roomID] = room
	roomManager.Mutex.Unlock()

	response := map[string]string{
		"room_id":  roomID,
		"username": payload.CreatorName,
	}

	err = app.jsonResponse(w, http.StatusCreated, response)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

func generateRoomID() string {
	roomID := fmt.Sprintf("%d", time.Now().UnixNano()/1000000000)
	fmt.Printf("Generated room ID: %s\n", roomID)
	return roomID
}
