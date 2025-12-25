package api

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/pockode/server/agent"
	"github.com/pockode/server/session"
)

// mockAgent implements agent.Agent for testing.
type mockAgent struct {
	sessionID   string
	lastSession *mockSession
}

func (m *mockAgent) Start(ctx context.Context, workDir string, sessionID string) (agent.Session, error) {
	m.lastSession = &mockSession{sessionID: m.sessionID}
	return m.lastSession, nil
}

type mockSession struct {
	sessionID string
	closed    bool
}

func (m *mockSession) Events() <-chan agent.AgentEvent {
	ch := make(chan agent.AgentEvent, 1)
	ch <- agent.AgentEvent{Type: agent.EventTypeDone, SessionID: m.sessionID}
	close(ch)
	return ch
}

func (m *mockSession) SendMessage(prompt string) error { return nil }

func (m *mockSession) SendPermissionResponse(requestID string, allow bool) error { return nil }

func (m *mockSession) SendInterrupt() error { return nil }

func (m *mockSession) Close() { m.closed = true }

func TestSessionHandler_List(t *testing.T) {
	store, _ := session.NewFileStore(t.TempDir())
	store.Create("session-1")
	store.Create("session-2")

	handler := NewSessionHandler(store, nil, "")
	req := httptest.NewRequest(http.MethodGet, "/api/sessions", nil)
	rec := httptest.NewRecorder()

	handler.HandleList(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}

	var resp struct {
		Sessions []session.SessionMeta `json:"sessions"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(resp.Sessions) != 2 {
		t.Errorf("expected 2 sessions, got %d", len(resp.Sessions))
	}
}

func TestSessionHandler_Create(t *testing.T) {
	store, _ := session.NewFileStore(t.TempDir())
	mockAg := &mockAgent{sessionID: "mock-session-id"}
	handler := NewSessionHandler(store, mockAg, "/tmp")

	req := httptest.NewRequest(http.MethodPost, "/api/sessions", nil)
	rec := httptest.NewRecorder()

	handler.HandleCreate(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d", rec.Code)
	}

	var sess session.SessionMeta
	if err := json.NewDecoder(rec.Body).Decode(&sess); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if sess.ID != "mock-session-id" {
		t.Errorf("expected ID 'mock-session-id', got %q", sess.ID)
	}
	if sess.Title != "New Chat" {
		t.Errorf("expected title 'New Chat', got %q", sess.Title)
	}

	// Verify session is persisted in store
	sessions, _ := store.List()
	if len(sessions) != 1 {
		t.Fatalf("expected 1 session in store, got %d", len(sessions))
	}
	if sessions[0].ID != "mock-session-id" {
		t.Errorf("expected stored session ID 'mock-session-id', got %q", sessions[0].ID)
	}

	// Verify agent session was closed
	if !mockAg.lastSession.closed {
		t.Error("expected agent session to be closed")
	}
}

func TestSessionHandler_Delete(t *testing.T) {
	store, _ := session.NewFileStore(t.TempDir())
	sess, _ := store.Create("session-to-delete")

	handler := NewSessionHandler(store, nil, "")
	mux := http.NewServeMux()
	handler.Register(mux)

	req := httptest.NewRequest(http.MethodDelete, "/api/sessions/"+sess.ID, nil)
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("expected status 204, got %d", rec.Code)
	}

	// Verify deleted
	sessions, _ := store.List()
	if len(sessions) != 0 {
		t.Errorf("expected 0 sessions after delete, got %d", len(sessions))
	}
}

func TestSessionHandler_Update(t *testing.T) {
	store, _ := session.NewFileStore(t.TempDir())
	sess, _ := store.Create("session-to-update")

	handler := NewSessionHandler(store, nil, "")
	mux := http.NewServeMux()
	handler.Register(mux)

	body := strings.NewReader(`{"title":"Updated Title"}`)
	req := httptest.NewRequest(http.MethodPatch, "/api/sessions/"+sess.ID, body)
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("expected status 204, got %d", rec.Code)
	}

	// Verify updated
	sessions, _ := store.List()
	if sessions[0].Title != "Updated Title" {
		t.Errorf("expected title 'Updated Title', got %q", sessions[0].Title)
	}
}

func TestSessionHandler_Update_EmptyTitle(t *testing.T) {
	store, _ := session.NewFileStore(t.TempDir())
	sess, _ := store.Create("session-for-empty-title")

	handler := NewSessionHandler(store, nil, "")
	mux := http.NewServeMux()
	handler.Register(mux)

	body := strings.NewReader(`{"title":""}`)
	req := httptest.NewRequest(http.MethodPatch, "/api/sessions/"+sess.ID, body)
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", rec.Code)
	}
}
