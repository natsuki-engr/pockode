package logger

import (
	"log"
	"os"
)

var debugMode = os.Getenv("DEBUG") == "true"

// Debug logs a message only when DEBUG=true.
func Debug(format string, v ...any) {
	if debugMode {
		log.Printf("[DEBUG] "+format, v...)
	}
}

// Info logs an info-level message.
func Info(format string, v ...any) {
	log.Printf("[INFO] "+format, v...)
}

// Error logs an error-level message.
func Error(format string, v ...any) {
	log.Printf("[ERROR] "+format, v...)
}

// Truncate returns a truncated version of s for safe logging.
// Useful for logging user content without exposing full prompt.
func Truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
