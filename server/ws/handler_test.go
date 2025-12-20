package ws

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/coder/websocket"
	"github.com/pockode/server/agent"
)

// mockAgent implements agent.Agent for testing.
type mockAgent struct {
	events []agent.AgentEvent
	err    error
}

func (m *mockAgent) Run(ctx context.Context, prompt string, workDir string) (<-chan agent.AgentEvent, error) {
	if m.err != nil {
		return nil, m.err
	}

	ch := make(chan agent.AgentEvent)
	go func() {
		defer close(ch)
		for _, event := range m.events {
			select {
			case ch <- event:
			case <-ctx.Done():
				return
			}
		}
	}()
	return ch, nil
}

func TestHandler_MissingToken(t *testing.T) {
	h := NewHandler("secret-token", &mockAgent{}, "/tmp", true)

	req := httptest.NewRequest(http.MethodGet, "/ws", nil)
	rec := httptest.NewRecorder()

	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
	}

	if !strings.Contains(rec.Body.String(), "Missing token") {
		t.Errorf("expected 'Missing token' in body, got %q", rec.Body.String())
	}
}

func TestHandler_InvalidToken(t *testing.T) {
	h := NewHandler("secret-token", &mockAgent{}, "/tmp", true)

	req := httptest.NewRequest(http.MethodGet, "/ws?token=wrong-token", nil)
	rec := httptest.NewRecorder()

	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
	}

	if !strings.Contains(rec.Body.String(), "Invalid token") {
		t.Errorf("expected 'Invalid token' in body, got %q", rec.Body.String())
	}
}

func TestHandler_WebSocketConnection(t *testing.T) {
	events := []agent.AgentEvent{
		{Type: agent.EventTypeText, Content: "Hello"},
		{Type: agent.EventTypeDone},
	}
	h := NewHandler("test-token", &mockAgent{events: events}, "/tmp", true)

	server := httptest.NewServer(h)
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "?token=test-token"

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	conn, _, err := websocket.Dial(ctx, wsURL, nil)
	if err != nil {
		t.Fatalf("failed to connect: %v", err)
	}
	defer conn.Close(websocket.StatusNormalClosure, "")

	// Send a message
	msg := ClientMessage{
		Type:    "message",
		ID:      "test-123",
		Content: "Hello AI",
	}
	msgData, _ := json.Marshal(msg)
	if err := conn.Write(ctx, websocket.MessageText, msgData); err != nil {
		t.Fatalf("failed to write: %v", err)
	}

	// Read responses
	var responses []ServerMessage
	for i := 0; i < 2; i++ {
		_, data, err := conn.Read(ctx)
		if err != nil {
			t.Fatalf("failed to read: %v", err)
		}
		var resp ServerMessage
		if err := json.Unmarshal(data, &resp); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		responses = append(responses, resp)
	}

	// Verify responses
	if len(responses) != 2 {
		t.Fatalf("expected 2 responses, got %d", len(responses))
	}

	if responses[0].Type != "text" || responses[0].Content != "Hello" {
		t.Errorf("unexpected first response: %+v", responses[0])
	}

	if responses[1].Type != "done" {
		t.Errorf("unexpected second response: %+v", responses[1])
	}

	if responses[0].MessageID != "test-123" {
		t.Errorf("expected message_id 'test-123', got %q", responses[0].MessageID)
	}
}

