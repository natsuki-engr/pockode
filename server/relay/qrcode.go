package relay

import (
	"os"

	"github.com/mdp/qrterminal/v3"
)

// PrintQRCode prints a QR code to the terminal.
func PrintQRCode(content string) {
	qrterminal.GenerateWithConfig(content, qrterminal.Config{
		Level:     qrterminal.L,
		Writer:    os.Stdout,
		BlackChar: qrterminal.BLACK,
		WhiteChar: qrterminal.WHITE,
		QuietZone: 1,
	})
}
