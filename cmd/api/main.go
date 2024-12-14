package main

import (
	"log"

	"github.com/yenxxxw/collaborative-text-editor/internal/db"
	"github.com/yenxxxw/collaborative-text-editor/internal/store"
	// "go.uber.org/zap"
)

func main() {

	cfg := config{
		addr: ":8080",
		db: dbConfig{
			addr:         "postgres://admin:adminpassword@localhost/collaborative_code_editor?sslmode=disable",
			maxOpenConns: 30,
			maxIdleConns: 30,
			maxIdleTime:  "15m",
		},
	}

	db, err := db.New(
		cfg.db.addr,
		cfg.db.maxOpenConns,
		cfg.db.maxIdleConns,
		cfg.db.maxIdleTime,
	)

	if err != nil {
		log.Panic(err)
	}

	defer db.Close()

	log.Print("database connection pool established")
	store := store.NewStorage(db)

	app := &application{
		config: cfg,
		store:  store,
	}

	mux := app.mount()

	log.Fatal(app.run(mux))
}
