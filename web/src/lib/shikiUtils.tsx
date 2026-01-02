import { getDiffViewHighlighter } from "@git-diff-view/shiki";
import { useSyncExternalStore } from "react";
import ShikiHighlighter from "react-shiki";
import { bundledLanguagesInfo } from "shiki";

const EXT_MAP: Record<string, string> = {};
for (const lang of bundledLanguagesInfo) {
	EXT_MAP[lang.id] = lang.id;
	if (lang.aliases) {
		for (const alias of lang.aliases) {
			EXT_MAP[alias] = lang.id;
		}
	}
}

export function getLanguageFromPath(path: string): string | undefined {
	const fileName = path.split("/").pop() ?? "";

	if (fileName.toLowerCase() === "dockerfile") return "docker";
	if (fileName.startsWith(".env")) return "shellscript";

	const ext = fileName.split(".").pop()?.toLowerCase();
	return ext ? EXT_MAP[ext] : undefined;
}

export function isMarkdownFile(path: string): boolean {
	const ext = path.split(".").pop()?.toLowerCase();
	return ext === "md" || ext === "mdx";
}

let highlighterPromise: ReturnType<typeof getDiffViewHighlighter> | null = null;

export function getDiffHighlighter() {
	if (!highlighterPromise) {
		highlighterPromise = getDiffViewHighlighter();
	}
	return highlighterPromise;
}

export function subscribeToDarkMode(callback: () => void) {
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.attributeName === "class") {
				callback();
			}
		}
	});
	observer.observe(document.documentElement, { attributes: true });
	return () => observer.disconnect();
}

export function getIsDarkMode() {
	return document.documentElement.classList.contains("dark");
}

export function getShikiTheme() {
	return getIsDarkMode() ? "github-dark" : "github-light";
}

export function CodeHighlighter({
	children,
	language,
}: {
	children: string;
	language?: string;
}) {
	const theme = useSyncExternalStore(subscribeToDarkMode, getShikiTheme);
	return (
		<ShikiHighlighter language={language} theme={theme}>
			{children}
		</ShikiHighlighter>
	);
}
