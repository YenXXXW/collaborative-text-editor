package store

import (
	"context"
	"database/sql"
)

type Program struct {
	ID       int64  `json:"id"`
	Language string `json:"language"`
	Code     string `json:"code"`
	RoomId   int    `json:"room_id"`
}

type ProgramStore struct {
	db *sql.DB
}

func (s *ProgramStore) Create(ctx context.Context, program *Program) error {
	query := `INSERT INTO programs (language, code, room_id) VALUES ($1, $2, $3) RETURENING language, code`

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
		return err
	}

	return nil
}
