package main

import (
	"log"
	"net/http"
)

func (app *application) internalServerError(w http.ResponseWriter, r *http.Request, err error) {
	//app.logger.Errorw("internal error", "method", r.Method, "path", r.URL.Path, "error", err.Error())

	log.Printf("internal server error, %v, %v", r.Method, err.Error())
	writeJSONError(w, http.StatusInternalServerError, "the server encountered a problem")
}

func (app *application) badRequestResponse(w http.ResponseWriter, r *http.Request, err error) {
	//app.logger.Info("erorr", err)
	//app.logger.Warnf("bad request", "method", r.Method, "path", r.URL.Path, "error", err.Error())
	log.Printf("bad request, %v, %v", r.Method, err.Error())

	writeJSONError(w, http.StatusBadRequest, err.Error())
}

func (app *application) notFoundResponse(w http.ResponseWriter, r *http.Request, err error) {
	//app.logger.Warnf("not found error", "method", r.Method, "path", r.URL.Path, "error", err.Error())

	log.Printf("not found error, %v, ", r.Method)
	writeJSONError(w, http.StatusNotFound, "not found")
}
