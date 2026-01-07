package ws

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/google/uuid"
	"github.com/pockode/server/rpc"
	"github.com/pockode/server/session"
	"github.com/sourcegraph/jsonrpc2"
)

func (h *rpcMethodHandler) handleSessionList(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	sessions, err := h.sessionStore.List()
	if err != nil {
		h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInternalError, "failed to list sessions")
		return
	}

	result := struct {
		Sessions []session.SessionMeta `json:"sessions"`
	}{Sessions: sessions}

	if err := conn.Reply(ctx, req.ID, result); err != nil {
		h.log.Error("failed to send session list response", "error", err)
	}
}

func (h *rpcMethodHandler) handleSessionCreate(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	sessionID := uuid.Must(uuid.NewV7()).String()

	sess, err := h.sessionStore.Create(ctx, sessionID)
	if err != nil {
		h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInternalError, "failed to create session")
		return
	}

	h.log.Info("session created", "sessionId", sessionID)

	if err := conn.Reply(ctx, req.ID, sess); err != nil {
		h.log.Error("failed to send session create response", "error", err)
	}
}

func (h *rpcMethodHandler) handleSessionDelete(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	var params rpc.SessionDeleteParams
	if err := unmarshalParams(req, &params); err != nil {
		h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInvalidParams, "invalid params")
		return
	}

	h.manager.Close(params.SessionID)
	if err := h.sessionStore.Delete(ctx, params.SessionID); err != nil {
		h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInternalError, "failed to delete session")
		return
	}

	h.log.Info("session deleted", "sessionId", params.SessionID)

	if err := conn.Reply(ctx, req.ID, struct{}{}); err != nil {
		h.log.Error("failed to send session delete response", "error", err)
	}
}

func (h *rpcMethodHandler) handleSessionUpdateTitle(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	var params rpc.SessionUpdateTitleParams
	if err := unmarshalParams(req, &params); err != nil {
		h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInvalidParams, "invalid params")
		return
	}

	if params.Title == "" {
		h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInvalidParams, "title required")
		return
	}

	if err := h.sessionStore.Update(ctx, params.SessionID, params.Title); err != nil {
		if errors.Is(err, session.ErrSessionNotFound) {
			h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInvalidParams, "session not found")
			return
		}
		h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInternalError, "failed to update session")
		return
	}

	h.log.Info("session title updated", "sessionId", params.SessionID, "title", params.Title)

	if err := conn.Reply(ctx, req.ID, struct{}{}); err != nil {
		h.log.Error("failed to send session update response", "error", err)
	}
}

func (h *rpcMethodHandler) handleSessionGetHistory(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	var params rpc.SessionGetHistoryParams
	if err := unmarshalParams(req, &params); err != nil {
		h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInvalidParams, "invalid params")
		return
	}

	history, err := h.sessionStore.GetHistory(ctx, params.SessionID)
	if err != nil {
		h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInternalError, "failed to get history")
		return
	}

	result := struct {
		History []json.RawMessage `json:"history"`
	}{History: history}

	if err := conn.Reply(ctx, req.ID, result); err != nil {
		h.log.Error("failed to send history response", "error", err)
	}
}
