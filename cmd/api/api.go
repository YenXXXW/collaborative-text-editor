package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	//"github.com/yenxxxw/collaborative-text-editor/internal/store"
	"go.uber.org/zap"
)

const (
	writeWait      = 10 * time.Second // Time allowed to write a message
	pongWait       = 60 * time.Second // Time allowed to read pong
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 65536
)

type application struct {
	config config
	//store  store.Storage
	logger *zap.SugaredLogger
}

type config struct {
	addr string
	//db   dbConfig
}

type dbConfig struct {
	addr         string
	maxOpenConns int
	maxIdleConns int
	maxIdleTime  string
}

func (app *application) mount() http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(middleware.Timeout(60 * time.Second))

	r.Use(cors.Handler(cors.Options{
		AllowOriginFunc:  AllowOriginFunc,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	r.Route("/v1", func(r chi.Router) {
		r.Get("/health", app.healthCheckHandler)
		r.Get("/ws", app.joinRoomHandler)
		r.Post("/create-room", app.createRoomHandler)
	})

	return r
}

func (app *application) run(mux http.Handler) error {
	srv := &http.Server{
		Addr:         app.config.addr,
		Handler:      mux,
		WriteTimeout: time.Second * 30,
		ReadTimeout:  time.Second * 10,
		IdleTimeout:  time.Minute,
	}
	log.Printf("server has startted at %s", app.config.addr)
	return srv.ListenAndServe()
}

func AllowOriginFunc(r *http.Request, origin string) bool {
	return origin == os.Getenv("ALLOWED_LOCAL_ORIGIN") || origin == os.Getenv("ALLOWED_DEPLOYED_ORIGIN")
}
