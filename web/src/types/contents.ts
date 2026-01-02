export type EntryType = "file" | "dir";
export type Encoding = "text" | "base64";

export interface Entry {
	name: string;
	type: EntryType;
	path: string;
}

export interface FileContent {
	name: string;
	type: "file";
	path: string;
	content: string;
	encoding: Encoding;
}

export type ContentsResponse = Entry[] | FileContent;

export function isFileContent(
	response: ContentsResponse,
): response is FileContent {
	return !Array.isArray(response) && response.type === "file";
}
