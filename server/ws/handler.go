package ws

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"

	"github.com/coder/websocket"
	"github.com/google/uuid"
	"github.com/pockode/server/agent"
	"github.com/pockode/server/session"
)

type Handler struct {
	token        string
	agent        agent.Agent
	workDir      string
	devMode      bool
	sessionStore session.Store
}

func NewHandler(token string, ag agent.Agent, workDir string, devMode bool, store session.Store) *Handler {
	return &Handler{
		token:        token,
		agent:        ag,
		workDir:      workDir,
		devMode:      devMode,
		sessionStore: store,
	}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	queryToken := r.URL.Query().Get("token")
	if queryToken == "" {
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}

	if subtle.ConstantTimeCompare([]byte(queryToken), []byte(h.token)) != 1 {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		InsecureSkipVerify: h.devMode,
	})
	if err != nil {
		slog.Error("failed to accept websocket", "error", err)
		return
	}
	defer conn.Close(websocket.StatusNormalClosure, "")

	h.handleConnection(r.Context(), conn)
}

// connectionState holds agent processes for a single WebSocket connection.
// Agent processes are connection-scoped; session metadata lives in sessionStore.
type connectionState struct {
	mu       sync.Mutex
	sessions map[string]agent.Session // sessionID -> session

	// writeMu protects WebSocket writes from concurrent access
	writeMu sync.Mutex
}

func (c *connectionState) Close(log *slog.Logger) {
	c.mu.Lock()
	defer c.mu.Unlock()
	for sessionID, sess := range c.sessions {
		log.Info("closing session", "sessionId", sessionID)
		sess.Close()
	}
}

func (h *Handler) handleConnection(ctx context.Context, conn *websocket.Conn) {
	connLog := slog.With("connId", uuid.Must(uuid.NewV7()).String())
	connLog.Info("new websocket connection")

	state := &connectionState{
		sessions: make(map[string]agent.Session),
	}
	defer state.Close(connLog)

	for {
		_, data, err := conn.Read(ctx)
		if err != nil {
			connLog.Debug("websocket read error", "error", err)
			return
		}

		connLog.Debug("received message", "length", len(data))

		var msg ClientMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			connLog.Error("failed to unmarshal message", "error", err)
			h.sendErrorWithLock(ctx, conn, state, "Invalid message format")
			continue
		}

		log := connLog.With("sessionId", msg.SessionID)
		log.Debug("parsed message", "type", msg.Type)

		switch msg.Type {
		case "message":
			if err := h.handleMessage(ctx, log, conn, msg, state); err != nil {
				log.Error("handleMessage error", "error", err)
				h.sendErrorWithLock(ctx, conn, state, err.Error())
			}

		case "interrupt":
			if err := h.handleInterrupt(log, msg, state); err != nil {
				log.Error("interrupt error", "error", err)
				h.sendErrorWithLock(ctx, conn, state, err.Error())
			}

		case "permission_response":
			if err := h.handlePermissionResponse(msg, state); err != nil {
				log.Error("permission response error", "error", err)
				h.sendErrorWithLock(ctx, conn, state, err.Error())
			}

		case "question_response":
			if err := h.handleQuestionResponse(msg, state); err != nil {
				log.Error("question response error", "error", err)
				h.sendErrorWithLock(ctx, conn, state, err.Error())
			}

		default:
			h.sendErrorWithLock(ctx, conn, state, "Unknown message type")
		}
	}
}

// Protected by state.mu to prevent race conditions on check-and-create.
func (h *Handler) getOrCreateSession(ctx context.Context, log *slog.Logger, conn *websocket.Conn, sessionID string, state *connectionState) (agent.Session, error) {
	state.mu.Lock()
	defer state.mu.Unlock()

	if sess, exists := state.sessions[sessionID]; exists {
		return sess, nil
	}

	meta, found, err := h.sessionStore.Get(sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get session: %w", err)
	}
	if !found {
		return nil, fmt.Errorf("session not found: %s", sessionID)
	}

	resume := meta.Activated

	sess, err := h.agent.Start(ctx, h.workDir, sessionID, resume)
	if err != nil {
		return nil, err
	}

	state.sessions[sessionID] = sess

	if !resume {
		if err := h.sessionStore.Activate(ctx, sessionID); err != nil {
			log.Error("failed to activate session", "error", err)
		}
	}

	go h.streamEvents(ctx, log, conn, sessionID, sess, state)

	log.Info("started session", "resume", resume)

	return sess, nil
}

func (h *Handler) handleMessage(ctx context.Context, log *slog.Logger, conn *websocket.Conn, msg ClientMessage, state *connectionState) error {
	sess, err := h.getOrCreateSession(ctx, log, conn, msg.SessionID, state)
	if err != nil {
		return err
	}

	log.Info("received prompt", "length", len(msg.Content))

	if err := h.sessionStore.AppendToHistory(ctx, msg.SessionID, msg); err != nil {
		log.Error("failed to append to history", "error", err)
	}

	return sess.SendMessage(msg.Content)
}

// Soft stop that preserves the session for future messages.
func (h *Handler) handleInterrupt(log *slog.Logger, msg ClientMessage, state *connectionState) error {
	state.mu.Lock()
	sess, exists := state.sessions[msg.SessionID]
	state.mu.Unlock()

	if !exists {
		return fmt.Errorf("session not found: %s", msg.SessionID)
	}

	if err := sess.SendInterrupt(); err != nil {
		return fmt.Errorf("failed to send interrupt: %w", err)
	}

	log.Info("sent interrupt")
	return nil
}

func (h *Handler) handlePermissionResponse(msg ClientMessage, state *connectionState) error {
	state.mu.Lock()
	sess, exists := state.sessions[msg.SessionID]
	state.mu.Unlock()

	if !exists {
		return fmt.Errorf("session not found: %s", msg.SessionID)
	}

	choice := parsePermissionChoice(msg.Choice)
	return sess.SendPermissionResponse(msg.RequestID, choice)
}

func (h *Handler) handleQuestionResponse(msg ClientMessage, state *connectionState) error {
	state.mu.Lock()
	sess, exists := state.sessions[msg.SessionID]
	state.mu.Unlock()

	if !exists {
		return fmt.Errorf("session not found: %s", msg.SessionID)
	}

	return sess.SendQuestionResponse(msg.RequestID, msg.Answers)
}

func parsePermissionChoice(choice string) agent.PermissionChoice {
	switch choice {
	case "allow":
		return agent.PermissionAllow
	case "always_allow":
		return agent.PermissionAlwaysAllow
	default:
		return agent.PermissionDeny
	}
}

func (h *Handler) streamEvents(ctx context.Context, log *slog.Logger, conn *websocket.Conn, sessionID string, sess agent.Session, state *connectionState) {
	for event := range sess.Events() {
		log.Debug("streaming event", "type", event.Type)

		serverMsg := ServerMessage{
			Type:                  string(event.Type),
			SessionID:             sessionID,
			Content:               event.Content,
			ToolName:              event.ToolName,
			ToolInput:             event.ToolInput,
			ToolUseID:             event.ToolUseID,
			ToolResult:            event.ToolResult,
			Error:                 event.Error,
			RequestID:             event.RequestID,
			PermissionSuggestions: event.PermissionSuggestions,
			Questions:             event.Questions,
		}

		if err := h.sessionStore.AppendToHistory(ctx, sessionID, serverMsg); err != nil {
			log.Error("failed to append to history", "error", err)
		}

		if err := h.sendWithLock(ctx, conn, state, serverMsg); err != nil {
			log.Error("send error", "error", err)
			return
		}
	}
}

func (h *Handler) sendWithLock(ctx context.Context, conn *websocket.Conn, state *connectionState, msg ServerMessage) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	state.writeMu.Lock()
	defer state.writeMu.Unlock()
	return conn.Write(ctx, websocket.MessageText, data)
}

func (h *Handler) sendErrorWithLock(ctx context.Context, conn *websocket.Conn, state *connectionState, errMsg string) error {
	return h.sendWithLock(ctx, conn, state, ServerMessage{
		Type:  "error",
		Error: errMsg,
	})
}
