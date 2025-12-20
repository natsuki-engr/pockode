package ws

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"net/http"

	"github.com/coder/websocket"
	"github.com/pockode/server/agent"
	"github.com/pockode/server/logger"
)

const (
	// promptLogMaxLen limits prompt length in logs for privacy.
	promptLogMaxLen = 50
)

// Handler handles WebSocket connections for chat.
type Handler struct {
	token   string
	agent   agent.Agent
	workDir string
	devMode bool
}

// NewHandler creates a new WebSocket handler.
func NewHandler(token string, ag agent.Agent, workDir string, devMode bool) *Handler {
	return &Handler{
		token:   token,
		agent:   ag,
		workDir: workDir,
		devMode: devMode,
	}
}

// ServeHTTP handles HTTP requests and upgrades to WebSocket.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Validate token from query parameter
	queryToken := r.URL.Query().Get("token")
	if queryToken == "" {
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}

	if subtle.ConstantTimeCompare([]byte(queryToken), []byte(h.token)) != 1 {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Accept WebSocket connection
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		InsecureSkipVerify: h.devMode,
	})
	if err != nil {
		logger.Error("Failed to accept websocket: %v", err)
		return
	}
	defer conn.Close(websocket.StatusNormalClosure, "")

	h.handleConnection(r.Context(), conn)
}

// handleConnection manages the WebSocket connection lifecycle.
func (h *Handler) handleConnection(ctx context.Context, conn *websocket.Conn) {
	logger.Info("handleConnection: new connection")
	var cancel context.CancelFunc

	for {
		_, data, err := conn.Read(ctx)
		if err != nil {
			logger.Debug("handleConnection: read error: %v", err)
			if cancel != nil {
				cancel()
			}
			return
		}

		logger.Debug("handleConnection: received message (len=%d)", len(data))

		var msg ClientMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			logger.Error("handleConnection: unmarshal error: %v", err)
			h.sendError(ctx, conn, "", "Invalid message format")
			continue
		}

		logger.Debug("handleConnection: parsed message type=%s, id=%s", msg.Type, msg.ID)

		switch msg.Type {
		case "message":
			if cancel != nil {
				cancel()
			}
			var msgCtx context.Context
			msgCtx, cancel = context.WithCancel(ctx)
			go h.handleMessage(msgCtx, conn, msg)

		case "cancel":
			if cancel != nil {
				cancel()
				cancel = nil
			}

		default:
			h.sendError(ctx, conn, msg.ID, "Unknown message type")
		}
	}
}

// handleMessage processes a user message and streams the response.
func (h *Handler) handleMessage(ctx context.Context, conn *websocket.Conn, msg ClientMessage) {
	logger.Info("handleMessage: prompt=%q, workDir=%s", logger.Truncate(msg.Content, promptLogMaxLen), h.workDir)

	events, err := h.agent.Run(ctx, msg.Content, h.workDir)
	if err != nil {
		logger.Error("agent.Run error: %v", err)
		h.sendError(ctx, conn, msg.ID, err.Error())
		return
	}

	for event := range events {
		logger.Debug("event: type=%s", event.Type)

		serverMsg := ServerMessage{
			Type:       string(event.Type),
			MessageID:  msg.ID,
			Content:    event.Content,
			ToolName:   event.ToolName,
			ToolInput:  event.ToolInput,
			ToolUseID:  event.ToolUseID,
			ToolResult: event.ToolResult,
			Error:      event.Error,
		}

		if err := h.send(ctx, conn, serverMsg); err != nil {
			logger.Error("send error: %v", err)
			return
		}
	}
}

// send writes a message to the WebSocket connection.
func (h *Handler) send(ctx context.Context, conn *websocket.Conn, msg ServerMessage) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	return conn.Write(ctx, websocket.MessageText, data)
}

// sendError sends an error message to the client.
func (h *Handler) sendError(ctx context.Context, conn *websocket.Conn, msgID, errMsg string) error {
	if err := h.send(ctx, conn, ServerMessage{
		Type:      "error",
		MessageID: msgID,
		Error:     errMsg,
	}); err != nil {
		logger.Error("sendError: failed to send error message: %v", err)
		return err
	}
	return nil
}
