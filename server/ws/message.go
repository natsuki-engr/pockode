package ws

import (
	"encoding/json"

	"github.com/pockode/server/agent"
)

// ClientMessageType represents the type of client-to-server messages.
type ClientMessageType string

const (
	ClientMessageAuth               ClientMessageType = "auth"
	ClientMessageAttach             ClientMessageType = "attach"
	ClientMessageMessage            ClientMessageType = "message"
	ClientMessageInterrupt          ClientMessageType = "interrupt"
	ClientMessagePermissionResponse ClientMessageType = "permission_response"
	ClientMessageQuestionResponse   ClientMessageType = "question_response"
)

// ClientMessage is the JSON wire format for client-to-server messages.
type ClientMessage struct {
	Type      ClientMessageType `json:"type"`
	Token     string            `json:"token,omitempty"`      // Auth token (for "auth" type)
	Content   string            `json:"content"`              // User input (for "message" type)
	SessionID string            `json:"session_id,omitempty"` // Session identifier
	RequestID string            `json:"request_id,omitempty"` // Request ID (for permission_response and question_response)
	Choice    string            `json:"choice,omitempty"`     // "deny", "allow", or "always_allow" (for permission_response)
	Answers   map[string]string `json:"answers,omitempty"`    // question -> selected label(s), nil = cancel (for question_response)

	// Fields for permission_response (client echoes back from permission_request)
	ToolInput             json.RawMessage          `json:"tool_input,omitempty"`
	ToolUseID             string                   `json:"tool_use_id,omitempty"`
	PermissionSuggestions []agent.PermissionUpdate `json:"permission_suggestions,omitempty"`
}

// ServerMessageType for ws-specific message types (auth, attach responses).
// For agent events, use agent.EventType directly (e.g., agent.EventTypeError).
const (
	ServerMessageAuthResponse   agent.EventType = "auth_response"
	ServerMessageAttachResponse agent.EventType = "attach_response"
)
