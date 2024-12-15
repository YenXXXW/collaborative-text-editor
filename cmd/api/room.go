package main

import (
	"github.com/gorilla/websocket"
	"github.com/yenxxxw/collaborative-text-editor/internal/store"
	"log"
	"net/http"
)

type CreateRoomPayload struct {
	UsersInRoom []int64 `json:"users_in_room"`
	CeatorId    int64   `json:"creator_id"`
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

func (app *application) joinRoomHandler(w http.ResponseWriter, r *http.Request) error {
	if conn, err := upgrader.Upgrade(w, r, nil); err != nil {
		app.internalServerError(w, r, err)
		log.Println(err)
		return
	}
}
