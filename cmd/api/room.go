package main

import (
	"net/http"

	"github.com/yenxxxw/collaborative-text-editor/internal/store"
)

type CreateRoomPayload struct {
	ID          int64   `json:"id"`
	UsersInRoom []int64 `json:"users_in_room"`
	CeatorId    int64   `json:"creator_id"`
}

func (app *application) createRoomHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreateRoomPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	room := &store.Room{
		UsersInRoom: payload.UsersInRoom,
		ID:          payload.ID,
		CeatorId:    payload.CeatorId,
	}

	ctx := r.Context()

	if err := app.store.Rooms.Create(ctx, room); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, room); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}
