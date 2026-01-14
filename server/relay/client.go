package relay

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"
)

var ErrInvalidToken = errors.New("invalid relay token")
var ErrUpgradeRequired = errors.New("client version too old, please upgrade Pockode")

type Client struct {
	baseURL       string
	clientVersion string
	httpClient    *http.Client
}

func NewClient(baseURL string) *Client {
	return NewClientWithVersion(baseURL, "")
}

func NewClientWithVersion(baseURL, version string) *Client {
	return &Client{
		baseURL:       baseURL,
		clientVersion: version,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) Register(ctx context.Context) (*StoredConfig, error) {
	url := c.baseURL + "/api/relay/register"

	body, _ := json.Marshal(map[string]string{"client_version": c.clientVersion})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusForbidden {
		return nil, ErrUpgradeRequired
	}
	if resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	var cfg StoredConfig
	if err := json.NewDecoder(resp.Body).Decode(&cfg); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	return &cfg, nil
}

func (c *Client) GetAnnouncement(ctx context.Context) string {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/api/announcement", nil)
	if err != nil {
		return ""
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return ""
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return ""
	}

	var ann struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&ann); err != nil {
		return ""
	}

	return ann.Message
}

func (c *Client) Refresh(ctx context.Context, relayToken string) (*StoredConfig, error) {
	url := c.baseURL + "/api/relay/refresh"

	body, _ := json.Marshal(map[string]string{
		"relay_token":    relayToken,
		"client_version": c.clientVersion,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusForbidden {
		return nil, ErrUpgradeRequired
	}
	if resp.StatusCode == http.StatusUnauthorized {
		return nil, ErrInvalidToken
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	var cfg StoredConfig
	if err := json.NewDecoder(resp.Body).Decode(&cfg); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	return &cfg, nil
}
