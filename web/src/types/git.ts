export interface FileStatus {
	path: string;
	status: "M" | "A" | "D" | "R" | "?";
}

export interface GitStatus {
	staged: FileStatus[];
	unstaged: FileStatus[];
}

export interface GitDiffResponse {
	diff: string;
	old_content: string;
	new_content: string;
}
