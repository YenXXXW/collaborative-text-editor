package store

import (
	"context"
	"database/sql"
)

type Storage struct {
	Programs interface {
		Create(context.Context, *Program) error
	}

	Rooms interface {
		Create(context.Context, *Room) error
	}
}

func NewStorage(db *sql.DB) Storage {
	return Storage{
		Programs: &ProgramStore{db},
		Rooms:    &RoomStore{db},
	}
}