package api

import (
	"encoding/json"
	"net/http"

	"github.com/pockode/server/contents"
	"github.com/pockode/server/git"
	"github.com/pockode/server/logger"
)

// GitHandler handles git-related REST endpoints.
type GitHandler struct {
	workDir string
}

// NewGitHandler creates a new git handler.
func NewGitHandler(workDir string) *GitHandler {
	return &GitHandler{workDir: workDir}
}

// HandleStatus handles GET /api/git/status
func (h *GitHandler) HandleStatus(w http.ResponseWriter, r *http.Request) {
	log := logger.NewRequestLogger()

	status, err := git.Status(h.workDir)
	if err != nil {
		log.Error("failed to get git status", "error", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(status); err != nil {
		log.Error("failed to encode git status response", "error", err)
	}
}

// HandleStagedDiff handles GET /api/git/staged/{path...}
func (h *GitHandler) HandleStagedDiff(w http.ResponseWriter, r *http.Request) {
	h.handleDiff(w, r, true)
}

// HandleUnstagedDiff handles GET /api/git/unstaged/{path...}
func (h *GitHandler) HandleUnstagedDiff(w http.ResponseWriter, r *http.Request) {
	h.handleDiff(w, r, false)
}

func (h *GitHandler) handleDiff(w http.ResponseWriter, r *http.Request, staged bool) {
	log := logger.NewRequestLogger()

	path := r.PathValue("path")
	if path == "" {
		http.Error(w, "Path required", http.StatusBadRequest)
		return
	}

	if err := contents.ValidatePath(h.workDir, path); err != nil {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	result, err := git.DiffWithContent(h.workDir, path, staged)
	if err != nil {
		log.Error("failed to get git diff", "error", err, "path", path, "staged", staged)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Error("failed to encode git diff response", "error", err)
	}
}

// Register registers git handlers to the given mux.
func (h *GitHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/git/status", h.HandleStatus)
	mux.HandleFunc("GET /api/git/staged/{path...}", h.HandleStagedDiff)
	mux.HandleFunc("GET /api/git/unstaged/{path...}", h.HandleUnstagedDiff)
}
