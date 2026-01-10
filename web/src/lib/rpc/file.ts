import type { JSONRPCRequester } from "json-rpc-2.0";
import type { Entry, FileContent } from "../../types/contents";

interface FileGetParams {
	path: string;
}

interface FileGetResult {
	type: "directory" | "file";
	entries?: Entry[];
	file?: FileContent;
}

export interface FileActions {
	getFile: (path?: string) => Promise<FileGetResult>;
}

export function createFileActions(
	getClient: () => JSONRPCRequester<void> | null,
): FileActions {
	const requireClient = (): JSONRPCRequester<void> => {
		const client = getClient();
		if (!client) {
			throw new Error("Not connected");
		}
		return client;
	};

	return {
		getFile: async (path = ""): Promise<FileGetResult> => {
			return requireClient().request("file.get", {
				path,
			} as FileGetParams);
		},
	};
}
