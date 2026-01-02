package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/pockode/server/contents"
)

func TestContentsHandler_ListRootDir(t *testing.T) {
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "file.txt"), []byte("hello"), 0644)
	os.Mkdir(filepath.Join(dir, "subdir"), 0755)

	handler := NewContentsHandler(dir)
	mux := http.NewServeMux()
	handler.Register(mux)

	req := httptest.NewRequest(http.MethodGet, "/api/contents", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var entries []contents.Entry
	if err := json.NewDecoder(rec.Body).Decode(&entries); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}

	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}

	if entries[0].Name != "subdir" || entries[0].Type != contents.TypeDir {
		t.Errorf("expected first entry to be subdir, got %+v", entries[0])
	}
	if entries[1].Name != "file.txt" || entries[1].Type != contents.TypeFile {
		t.Errorf("expected second entry to be file.txt, got %+v", entries[1])
	}
}

func TestContentsHandler_ListSubDir(t *testing.T) {
	dir := t.TempDir()
	os.MkdirAll(filepath.Join(dir, "src"), 0755)
	os.WriteFile(filepath.Join(dir, "src", "main.go"), []byte("package main"), 0644)

	handler := NewContentsHandler(dir)
	mux := http.NewServeMux()
	handler.Register(mux)

	req := httptest.NewRequest(http.MethodGet, "/api/contents/src", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var entries []contents.Entry
	json.NewDecoder(rec.Body).Decode(&entries)

	if len(entries) != 1 || entries[0].Name != "main.go" {
		t.Errorf("expected main.go, got %+v", entries)
	}
	if entries[0].Path != "src/main.go" {
		t.Errorf("expected path src/main.go, got %s", entries[0].Path)
	}
}

func TestContentsHandler_ReadFile(t *testing.T) {
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "hello.txt"), []byte("world"), 0644)

	handler := NewContentsHandler(dir)
	mux := http.NewServeMux()
	handler.Register(mux)

	req := httptest.NewRequest(http.MethodGet, "/api/contents/hello.txt", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var fc contents.FileContent
	json.NewDecoder(rec.Body).Decode(&fc)

	if fc.Content != "world" {
		t.Errorf("expected content 'world', got %q", fc.Content)
	}
	if fc.Encoding != contents.EncodingText {
		t.Errorf("expected encoding text, got %s", fc.Encoding)
	}
}

func TestContentsHandler_BinaryFile(t *testing.T) {
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "binary.bin"), []byte{0x00, 0x01, 0x02}, 0644)

	handler := NewContentsHandler(dir)
	mux := http.NewServeMux()
	handler.Register(mux)

	req := httptest.NewRequest(http.MethodGet, "/api/contents/binary.bin", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var fc contents.FileContent
	json.NewDecoder(rec.Body).Decode(&fc)

	if fc.Encoding != contents.EncodingBase64 {
		t.Errorf("expected encoding base64, got %s", fc.Encoding)
	}
	if fc.Content != "AAEC" { // base64 of []byte{0x00, 0x01, 0x02}
		t.Errorf("expected base64 content 'AAEC', got %q", fc.Content)
	}
}

func TestContentsHandler_NotFound(t *testing.T) {
	dir := t.TempDir()

	handler := NewContentsHandler(dir)
	mux := http.NewServeMux()
	handler.Register(mux)

	req := httptest.NewRequest(http.MethodGet, "/api/contents/nonexistent", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rec.Code)
	}
}

func TestContentsHandler_PathTraversal(t *testing.T) {
	dir := t.TempDir()

	handler := NewContentsHandler(dir)
	mux := http.NewServeMux()
	handler.Register(mux)

	paths := []string{
		"/api/contents/..%2F..%2Fetc%2Fpasswd",
		"/api/contents/..%2Ftest",
	}

	for _, path := range paths {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for %s, got %d", path, rec.Code)
		}
	}
}
