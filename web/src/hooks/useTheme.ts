import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeName = "abyss" | "aurora" | "ember" | "mint" | "void";

const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];
export const THEME_NAMES: ThemeName[] = [
	"abyss",
	"aurora",
	"ember",
	"mint",
	"void",
];

function isValidThemeMode(value: string | null): value is ThemeMode {
	return value !== null && THEME_MODES.includes(value as ThemeMode);
}

function isValidThemeName(value: string | null): value is ThemeName {
	return value !== null && THEME_NAMES.includes(value as ThemeName);
}

export interface ThemeInfo {
	label: string;
	description: string;
	accentLight: string;
	accentDark: string;
	previewBgLight: string;
	previewBgDark: string;
}

export const THEME_INFO: Record<ThemeName, ThemeInfo> = {
	abyss: {
		label: "Abyss",
		description: "深海科技",
		accentLight: "#0d9488",
		accentDark: "#2dd4bf",
		previewBgLight: "#f8fafb",
		previewBgDark: "#0c1220",
	},
	aurora: {
		label: "Aurora",
		description: "极光梦幻",
		accentLight: "#9333ea",
		accentDark: "#c084fc",
		previewBgLight: "#fbf9fe",
		previewBgDark: "#150a24",
	},
	ember: {
		label: "Ember",
		description: "温暖余烬",
		accentLight: "#c2410c",
		accentDark: "#fb923c",
		previewBgLight: "#fefcfa",
		previewBgDark: "#1c1412",
	},
	mint: {
		label: "Mint",
		description: "清新薄荷",
		accentLight: "#0891b2",
		accentDark: "#22d3ee",
		previewBgLight: "#f8fcfa",
		previewBgDark: "#0a1610",
	},
	void: {
		label: "Void",
		description: "极简虚空",
		accentLight: "#18181b",
		accentDark: "#fafafa",
		previewBgLight: "#ffffff",
		previewBgDark: "#09090b",
	},
};

const MODE_STORAGE_KEY = "theme-mode";
const NAME_STORAGE_KEY = "theme-name";

function getSystemTheme(): "light" | "dark" {
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function applyTheme(mode: ThemeMode, name: ThemeName) {
	const root = document.documentElement;
	const resolvedMode = mode === "system" ? getSystemTheme() : mode;

	// Apply dark mode
	root.classList.toggle("dark", resolvedMode === "dark");

	// Remove all theme classes
	for (const themeName of THEME_NAMES) {
		root.classList.remove(`theme-${themeName}`);
	}

	// Apply theme class
	root.classList.add(`theme-${name}`);
}

export function useTheme() {
	const [mode, setModeState] = useState<ThemeMode>(() => {
		if (typeof window === "undefined") return "system";
		const stored = localStorage.getItem(MODE_STORAGE_KEY);
		return isValidThemeMode(stored) ? stored : "system";
	});

	const [theme, setThemeState] = useState<ThemeName>(() => {
		if (typeof window === "undefined") return "abyss";
		const stored = localStorage.getItem(NAME_STORAGE_KEY);
		return isValidThemeName(stored) ? stored : "abyss";
	});

	const setMode = useCallback(
		(newMode: ThemeMode) => {
			setModeState(newMode);
			localStorage.setItem(MODE_STORAGE_KEY, newMode);
			applyTheme(newMode, theme);
		},
		[theme],
	);

	const setTheme = useCallback(
		(newTheme: ThemeName) => {
			setThemeState(newTheme);
			localStorage.setItem(NAME_STORAGE_KEY, newTheme);
			applyTheme(mode, newTheme);
		},
		[mode],
	);

	// Apply theme on mount
	useEffect(() => {
		applyTheme(mode, theme);
	}, [mode, theme]);

	// Listen to system preference changes when in "system" mode
	useEffect(() => {
		if (mode !== "system") return;

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => applyTheme("system", theme);

		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, [mode, theme]);

	const resolvedMode = mode === "system" ? getSystemTheme() : mode;

	return { mode, setMode, theme, setTheme, resolvedMode };
}
