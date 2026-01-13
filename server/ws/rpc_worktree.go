package ws

import (
	"context"
	"errors"

	"github.com/pockode/server/rpc"
	"github.com/pockode/server/worktree"
	"github.com/sourcegraph/jsonrpc2"
)

func (h *rpcMethodHandler) handleWorktreeList(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	registry := h.worktreeManager.Registry()
	worktrees := registry.List()

	result := rpc.WorktreeListResult{
		Worktrees: make([]rpc.WorktreeInfo, len(worktrees)),
	}
	for i, wt := range worktrees {
		result.Worktrees[i] = rpc.WorktreeInfo{
			Name:   wt.Name,
			Path:   wt.Path,
			Branch: wt.Branch,
			IsMain: wt.IsMain,
		}
	}

	if err := conn.Reply(ctx, req.ID, result); err != nil {
		h.log.Error("failed to send worktree list response", "error", err)
	}
}

func (h *rpcMethodHandler) handleWorktreeCreate(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	var params rpc.WorktreeCreateParams
	if err := unmarshalParams(req, &params); err != nil {
		h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInvalidParams, "invalid params")
		return
	}

	if params.Name == "" {
		h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInvalidParams, "name required")
		return
	}
	if params.Branch == "" {
		h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInvalidParams, "branch required")
		return
	}

	registry := h.worktreeManager.Registry()
	info, err := registry.Create(params.Name, params.Branch)
	if err != nil {
		switch {
		case errors.Is(err, worktree.ErrNotGitRepo):
			h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInvalidRequest, "not a git repository")
		case errors.Is(err, worktree.ErrWorktreeAlreadyExist):
			h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInvalidParams, "worktree already exists")
		default:
			h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInternalError, err.Error())
		}
		return
	}

	h.log.Info("worktree created", "name", info.Name, "branch", info.Branch)

	result := rpc.WorktreeCreateResult{
		Worktree: rpc.WorktreeInfo{
			Name:   info.Name,
			Path:   info.Path,
			Branch: info.Branch,
			IsMain: info.IsMain,
		},
	}
	if err := conn.Reply(ctx, req.ID, result); err != nil {
		h.log.Error("failed to send worktree create response", "error", err)
	}
}

func (h *rpcMethodHandler) handleWorktreeDelete(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	var params rpc.WorktreeDeleteParams
	if err := unmarshalParams(req, &params); err != nil {
		h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInvalidParams, "invalid params")
		return
	}

	if params.Name == "" {
		h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInvalidParams, "cannot delete main worktree")
		return
	}

	registry := h.worktreeManager.Registry()
	if err := registry.Delete(params.Name, params.Force); err != nil {
		switch {
		case errors.Is(err, worktree.ErrNotGitRepo):
			h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInvalidRequest, "not a git repository")
		case errors.Is(err, worktree.ErrWorktreeNotFound):
			h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInvalidParams, "worktree not found")
		default:
			h.replyError(ctx, conn, req.ID, jsonrpc2.CodeInternalError, err.Error())
		}
		return
	}

	h.log.Info("worktree deleted", "name", params.Name)

	// Force shutdown the worktree (notifies subscribers internally)
	h.worktreeManager.ForceShutdown(params.Name)

	if err := conn.Reply(ctx, req.ID, struct{}{}); err != nil {
		h.log.Error("failed to send worktree delete response", "error", err)
	}
}
