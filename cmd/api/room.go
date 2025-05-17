package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
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
	Program  string            `json:"program"`
	Language string            `json:"language"`
	Clients  map[*Client]bool  `json:"-"`
	Users    map[string]string `json:"users"`
}

type RoomManager struct {
	Rooms map[string]*Room
	Mutex sync.Mutex
	App   application
}

var reconnectTimers = struct {
	sync.RWMutex
	m map[string]context.CancelFunc
}{m: make(map[string]context.CancelFunc)}

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
	LeaveUser   *User      `json:"leaveuser"`
}

type CodeResult struct {
	Run struct {
		Stdout string      `json:"stdout"`
		Stderr string      `json:"stderr"`
		Code   int         `json:"code"`
		Signal interface{} `json:"signal"` // can be null, so use interface{}
		Output string      `json:"output"`
	} `json:"run"`
	Language string `json:"language"`
	Version  string `json:"version"`
}

func CreateRoom(client *Client) *Room {
	room := &Room{
		Program:  "// some comments",
		Clients:  make(map[*Client]bool),
		Language: "javascript",
		Users:    make(map[string]string),
	}

	//room.Clients[client] = true
	//room.Users[client.UserId] = client.UserName

	return room
}

func (rm *RoomManager) JoinRoom(roomId string, client *Client) {
	rm.Mutex.Lock()
	defer rm.Mutex.Unlock()

	if rm.Rooms[roomId] == nil {
		rm.Rooms[roomId] = CreateRoom(client)
	}

	rm.Rooms[roomId].Clients[client] = true
	rm.Rooms[roomId].Users[client.UserId] = client.UserName
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

	delete(room.Users, client.UserId)

	if len(room.Clients) == 0 {
		delete(rm.Rooms, roomId)
	}
}

func (rm *RoomManager) RemoveClient(roomId string, client *Client) {
	rm.Mutex.Lock()
	defer rm.Mutex.Unlock()

	room, ok := rm.Rooms[roomId]

	if !ok {
		return
	}

	delete(room.Clients, client)

}

func (rm *RoomManager) BroadcastToRoom(roomId string, message []byte) {
	rm.Mutex.Lock()
	defer rm.Mutex.Unlock()

	if room, ok := rm.Rooms[roomId]; ok {
		for client := range room.Clients {
			select {
			case client.Send <- message:

			default:

				rm.RemoveClient(roomId, client)
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

func (app *application) handleCheckRoom(w http.ResponseWriter, r *http.Request) {

	roomId := r.URL.Query().Get("roomId")
	if roomId == "" {
		app.badRequestResponse(w, r, errors.New("roomId is required"))
		return
	}

	exists := roomManager.checkRoom(roomId)

	if !exists {
		app.badRequestResponse(w, r, errors.New("room does not exist"))
		return
	}

	room := roomManager.Rooms[roomId]

	response := map[string]Room{
		"room": *room,
	}

	log.Println("response", response)

	app.jsonResponse(w, http.StatusOK, response)
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

	log.Printf("roomId %v, userId %v, username %v", roomId, userId, username)

	exists := roomManager.checkRoom(roomId)

	if !exists {
		log.Printf("room does not exist")

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
	var readErr error

	defer func() {
		if readErr != nil {
			if ce, ok := readErr.(*websocket.CloseError); ok && ce.Code == websocket.CloseGoingAway {

				roomManager.RemoveClient(client.RoomId, client)
				log.Printf("Temporary error for client %s, delaying removal", client.UserId)

				ctx, cancel := context.WithCancel(context.Background())

				reconnectTimers.RWMutex.Lock()
				reconnectTimers.m[client.UserId] = cancel

				reconnectTimers.RWMutex.Unlock()

				go func(c *Client) {
					select {
					case <-time.After(15 * time.Second):
						log.Printf("User %s did not rejoin in time", c.UserId)
						roomManager.RemoveClient(c.RoomId, c)
						roomManager.LeaveRoom(c.RoomId, c)
						close(client.Send)
						client.Conn.Close()

						reconnectTimers.Lock()
						delete(reconnectTimers.m, c.UserId)
						reconnectTimers.Unlock()

					case <-ctx.Done():
						log.Printf("User %s rejoined, canceled cleanup", c.UserId)
					}

				}(client)

			} else {
				roomManager.RemoveClient(client.RoomId, client)
				roomManager.LeaveRoom(client.RoomId, client)

				close(client.Send)
				client.Conn.Close()
			}
		}

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
			readErr = err
			log.Printf("Error reading message in handleClientReads: %v", err)
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			readErr = err
			log.Printf("Error unmarshalling message: %v", err)
			break
		}

		roomManager.Mutex.Lock()
		room, ok := roomManager.Rooms[client.RoomId]
		if ok {
			if msg.Change != nil && msg.Event == nil {
				log.Println(msg.Change)
				room.Program = applyChange(room.Program, msg.Change)
			}
			if msg.Event != nil && (*msg.Event == "new_user_joined" || *msg.Event == "user_rejoin") {
				if *msg.Event == "user_rejoin" {

					log.Printf("user %s rejoins the room", msg.UserId)
					if cancel, exists := reconnectTimers.m[msg.UserId]; exists {
						cancel()
						delete(reconnectTimers.m, msg.UserId)

					}

				}
				var usersInRoom []User
				for key, value := range room.Users {
					usersInRoom = append(usersInRoom, User{
						UserId:   key,
						UserName: value,
					})
				}
				msg.UsersInRoom = usersInRoom
			}
			if msg.Event != nil && *msg.Event == "user_leave" {

				log.Printf("user leave %s", msg.UserId)
				leaveUser := User{
					UserId:   client.UserId,
					UserName: room.Users[client.UserName],
				}

				delete(room.Users, client.UserId)
				delete(room.Clients, client)

				msg.LeaveUser = &leaveUser
				var usersInRoom []User

				for key, value := range room.Users {
					usersInRoom = append(usersInRoom, User{
						UserId:   key,
						UserName: value,
					})
				}
				msg.UsersInRoom = usersInRoom
				log.Println(usersInRoom)

			}

			if msg.Event != nil && *msg.Event == "new_program" {
				room.Program = "//some_comment"
			}

			if msg.Event != nil && *msg.Event == "lang_change" {
				room.Language = *msg.Language

			}
		}

		roomManager.Mutex.Unlock()

		jsonMsg, err := json.Marshal(msg)
		if err != nil {
			log.Printf("Error marshalling message: %v", err)
			continue
		}
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

func (app *application) runCodeHandler(w http.ResponseWriter, r *http.Request) {

	data := map[string]interface{}{
		"language": "js",
		"version":  "15.10.0",
		"files": []map[string]string{
			{
				"name":    "my_cool_code.js",
				"content": "console.log(process.argv)",
			},
		},
		"stdin":                "",
		"args":                 []string{"1", "2", "3"},
		"compile_timeout":      10000,
		"run_timeout":          3000,
		"compile_memory_limit": -1,
		"run_memory_limit":     -1,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Println("error parsing to json", err)
		app.badRequestResponse(w, r, err)

	}
	resp, neterr := http.Post("https://emkc.org/api/v2/piston/execute", "application/json", bytes.NewBuffer(jsonData))

	if neterr != nil {
		log.Println("error getting the run times", neterr)
		app.badRequestResponse(w, r, neterr)
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)

	if err != nil {
		log.Println("error reading response body", err)
	}

	var result CodeResult
	err = json.Unmarshal(body, &result)
	if err != nil {
		log.Println("error unmarshaling JSON", err)
		return
	}

	log.Printf("%+v\n", result)
}
