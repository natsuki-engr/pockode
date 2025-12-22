import { afterEach, describe, expect, it, vi } from "vitest";
import { getApiBaseUrl, getWebSocketUrl } from "./config";

describe("getApiBaseUrl", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns current origin when env is not set", () => {
		expect(getApiBaseUrl()).toBe(window.location.origin);
	});

	it("returns env value when VITE_API_BASE_URL is set", () => {
		vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
		expect(getApiBaseUrl()).toBe("https://api.example.com");
	});
});

describe("getWebSocketUrl", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("converts https to wss protocol", () => {
		vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
		expect(getWebSocketUrl()).toBe("wss://api.example.com/ws");
	});

	it("handles URL with port", () => {
		vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
		expect(getWebSocketUrl()).toBe("ws://localhost:3000/ws");
	});
});
