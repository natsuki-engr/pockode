import type { JSONRPCRequester } from "json-rpc-2.0";
import type {
	WorktreeCreateParams,
	WorktreeDeleteParams,
	WorktreeInfo,
	WorktreeListResult,
} from "../../types/message";

export interface WorktreeActions {
	listWorktrees: () => Promise<WorktreeInfo[]>;
	createWorktree: (name: string, branch: string) => Promise<void>;
	deleteWorktree: (name: string, force?: boolean) => Promise<void>;
}

export function createWorktreeActions(
	getClient: () => JSONRPCRequester<void> | null,
): WorktreeActions {
	const requireClient = (): JSONRPCRequester<void> => {
		const client = getClient();
		if (!client) {
			throw new Error("Not connected");
		}
		return client;
	};

	return {
		listWorktrees: async (): Promise<WorktreeInfo[]> => {
			const result: WorktreeListResult = await requireClient().request(
				"worktree.list",
				{},
			);
			return result.worktrees;
		},

		createWorktree: async (name: string, branch: string): Promise<void> => {
			const params: WorktreeCreateParams = { name, branch };
			await requireClient().request("worktree.create", params);
		},

		deleteWorktree: async (name: string, force?: boolean): Promise<void> => {
			const params: WorktreeDeleteParams = { name, force };
			await requireClient().request("worktree.delete", params);
		},
	};
}
