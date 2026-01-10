import type { JSONRPCRequester } from "json-rpc-2.0";
import type { GitDiffResponse, GitStatus } from "../../types/git";

interface GitDiffParams {
	path: string;
	staged: boolean;
}

export interface GitActions {
	getStatus: () => Promise<GitStatus>;
	getDiff: (path: string, staged: boolean) => Promise<GitDiffResponse>;
}

export function createGitActions(
	getClient: () => JSONRPCRequester<void> | null,
): GitActions {
	const requireClient = (): JSONRPCRequester<void> => {
		const client = getClient();
		if (!client) {
			throw new Error("Not connected");
		}
		return client;
	};

	return {
		getStatus: async (): Promise<GitStatus> => {
			return requireClient().request("git.status", {});
		},

		getDiff: async (
			path: string,
			staged: boolean,
		): Promise<GitDiffResponse> => {
			return requireClient().request("git.diff", {
				path,
				staged,
			} as GitDiffParams);
		},
	};
}
