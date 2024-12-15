package store

import (
	"context"
	"database/sql"
	"github.com/lib/pq"
	"log"
)

type Room struct {
	ID          int64   `json:"id"`
	UsersInRoom []int64 `json:"users_in_room"`
	CeatorId    int64   `json:"creator_id"`
	CreatedAt   string  `json:"created_at"`
}

type RoomStore struct {
	db *sql.DB
}

func (s *RoomStore) Create(ctx context.Context, room *Room) (*Room, error) {
	log.Print("room", room)
	query := `INSERT INTO	rooms (users_in_room, creator_id) VALUES ($1, $2) RETURNING id, users_in_room, creator_id, created_at`

	err := s.db.QueryRowContext(
		ctx,
		query,
		pq.Array(room.UsersInRoom),
		room.CeatorId,
	).Scan(
		&room.ID,
		pq.Array(&room.UsersInRoom),
		&room.CeatorId,
		&room.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return room, nil
}
