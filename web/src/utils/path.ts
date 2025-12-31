export function splitPath(fullPath: string): {
	fileName: string;
	directory: string;
} {
	const lastSlash = fullPath.lastIndexOf("/");
	if (lastSlash === -1) {
		return { fileName: fullPath, directory: "" };
	}
	return {
		fileName: fullPath.slice(lastSlash + 1),
		directory: fullPath.slice(0, lastSlash + 1),
	};
}
