package api

import (
	"encoding/json"

	"github.com/pockode/server/session"
)

// SessionListResponse is the response for GET /api/sessions.
type SessionListResponse struct {
	Sessions []session.SessionMeta `json:"sessions"`
}

// HistoryResponse is the response for GET /api/sessions/{id}/history.
type HistoryResponse struct {
	History []json.RawMessage `json:"history"`
}
