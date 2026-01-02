package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/pockode/server/contents"
	"github.com/pockode/server/logger"
)

type ContentsHandler struct {
	workDir string
}

func NewContentsHandler(workDir string) *ContentsHandler {
	return &ContentsHandler{workDir: workDir}
}

func (h *ContentsHandler) HandleContents(w http.ResponseWriter, r *http.Request) {
	log := logger.NewRequestLogger()

	path := r.PathValue("path")

	result, err := contents.GetContents(h.workDir, path)
	if err != nil {
		log.Error("failed to get contents", "error", err, "path", path)
		switch {
		case errors.Is(err, contents.ErrNotFound):
			http.Error(w, err.Error(), http.StatusNotFound)
		case errors.Is(err, contents.ErrInvalidPath):
			http.Error(w, err.Error(), http.StatusBadRequest)
		default:
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Error("failed to encode contents response", "error", err)
	}
}

func (h *ContentsHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/contents", h.HandleContents)
	mux.HandleFunc("GET /api/contents/{path...}", h.HandleContents)
}
