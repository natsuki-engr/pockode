import type { ContentsResponse } from "../types/contents";
import { fetchWithAuth } from "./api";

function encodePathSegments(path: string): string {
	return path.split("/").map(encodeURIComponent).join("/");
}

export async function getContents(path = ""): Promise<ContentsResponse> {
	const encodedPath = path ? encodePathSegments(path) : "";
	const url = encodedPath ? `/api/contents/${encodedPath}` : "/api/contents";
	const response = await fetchWithAuth(url);
	try {
		return await response.json();
	} catch (e) {
		throw new Error(
			`Failed to parse contents: ${e instanceof Error ? e.message : String(e)}`,
		);
	}
}
