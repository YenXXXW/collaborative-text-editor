package store

import (
	"context"
	"database/sql"
)

type Room struct {
	ID          int64    `json:"id"`
	UsersInRoom []string `json:"users_in_room"`
	CeatorId    string   `json:"creator_id"`
	CreatedAt   string   `json:"created_at"`
}

type RoomStore struct {
	db *sql.DB
}

func (s *RoomStore) Create(ctx context.Context, room *Room) error {
	query := `INSERT INTO	rooms (users_in_room, creator_id) VALUES ($1, $2, $3) RETURNING id, users_in_room, creator_id, created_at`

	err := s.db.QueryRowContext(
		ctx,
		query,
		room.UsersInRoom,
		room.CeatorId,
	).Scan(
		&room.ID,
		&room.UsersInRoom,
		&room.CeatorId,
		&room.CreatedAt,
	)

	if err != nil {
		return err
	}

	return nil
}