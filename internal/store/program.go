package store

import (
	"context"
	"database/sql"
	"log"
)

type Program struct {
	ID       int64  `json:"id"`
	Language string `json:"language"`
	Code     string `json:"code"`
	RoomId   int64  `json:"room_id"`
}

type ProgramStore struct {
	db *sql.DB
}

func (s *ProgramStore) Create(ctx context.Context, program *Program) error {
	query := `INSERT INTO programs (language, code, room_id) VALUES ($1, $2, $3) RETURNING language, code, room_id`

	err := s.db.QueryRowContext(
		ctx,
		query,
		program.Language,
		program.Code,
		program.RoomId,
	).Scan(
		&program.Language,
		&program.Code,
		&program.RoomId,
	)

	if err != nil {
		log.Print(err)
		return err

	}

	return nil
}
