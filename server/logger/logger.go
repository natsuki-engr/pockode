package logger

import (
	"log/slog"
	"os"
	"strings"

	"github.com/google/uuid"
)

// Init initializes the global slog logger. Call this at the start of main().
func Init() {
	level := parseLevel(os.Getenv("LOG_LEVEL"))
	var handler slog.Handler
	opts := &slog.HandlerOptions{Level: level}

	if os.Getenv("LOG_FORMAT") == "json" {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	} else {
		handler = slog.NewTextHandler(os.Stdout, opts)
	}

	slog.SetDefault(slog.New(handler))
}

func parseLevel(s string) slog.Level {
	switch strings.ToLower(s) {
	case "debug":
		return slog.LevelDebug
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

// NewRequestLogger creates a logger with a unique requestId for API handlers.
func NewRequestLogger() *slog.Logger {
	return slog.With("requestId", uuid.Must(uuid.NewV7()).String())
}
