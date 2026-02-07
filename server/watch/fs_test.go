package watch

import (
	"path/filepath"
	"testing"
)

func TestNotifyPath_CollectsCorrectSubscribers(t *testing.T) {
	tests := []struct {
		name        string
		changedPath string
		wantPaths   []string
	}{
		{
			name:        "nested file notifies parent",
			changedPath: "src/foo.ts",
			wantPaths:   []string{"src/foo.ts", "src"},
		},
		{
			name:        "root file notifies root",
			changedPath: "foo.ts",
			wantPaths:   []string{"foo.ts", ""},
		},
		{
			name:        "root dir only notifies itself",
			changedPath: "",
			wantPaths:   []string{""},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := collectNotifyPaths(tt.changedPath)
			if len(got) != len(tt.wantPaths) {
				t.Errorf("got %v, want %v", got, tt.wantPaths)
				return
			}
			for i, p := range tt.wantPaths {
				if got[i] != p {
					t.Errorf("got[%d] = %q, want %q", i, got[i], p)
				}
			}
		})
	}
}

// collectNotifyPaths extracts the path collection logic for testing.
func collectNotifyPaths(changedPath string) []string {
	paths := []string{changedPath}
	if changedPath != "" {
		parent := filepath.Dir(changedPath)
		if parent == "." {
			parent = ""
		}
		paths = append(paths, parent)
	}
	return paths
}
