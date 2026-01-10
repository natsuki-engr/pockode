package watch

import (
	"crypto/rand"
	"encoding/base32"
	"strings"
)

// GenerateID generates a unique watch ID.
// Format: "w_" + 10 random characters (lowercase alphanumeric)
func GenerateID() string {
	b := make([]byte, 6) // 6 bytes = 48 bits, enough for 10 base32 chars
	if _, err := rand.Read(b); err != nil {
		panic("crypto/rand failed: " + err.Error())
	}
	encoded := base32.StdEncoding.EncodeToString(b)
	// Take first 10 chars and make lowercase
	id := strings.ToLower(encoded[:10])
	return "w_" + id
}
