import { create } from "zustand";
import type { WorktreeInfo } from "../types/message";

const WORKTREE_KEY = "current_worktree";

interface WorktreeState {
	/** Current worktree name (empty string = main) */
	current: string;
	/** Whether current project is a git repository */
	isGitRepo: boolean;
}

export const useWorktreeStore = create<WorktreeState>(() => ({
	current: localStorage.getItem(WORKTREE_KEY) ?? "",
	isGitRepo: true,
}));

export const worktreeActions = {
	setCurrent: (name: string) => {
		if (name) {
			localStorage.setItem(WORKTREE_KEY, name);
		} else {
			localStorage.removeItem(WORKTREE_KEY);
		}
		useWorktreeStore.setState({ current: name });
	},

	setIsGitRepo: (isGitRepo: boolean) => {
		useWorktreeStore.setState({ isGitRepo });
	},

	getCurrent: () => useWorktreeStore.getState().current,

	reset: () => {
		localStorage.removeItem(WORKTREE_KEY);
		useWorktreeStore.setState({ current: "", isGitRepo: true });
	},
};

export function useCurrentWorktree(): string {
	return useWorktreeStore((state) => state.current);
}

export function useIsGitRepo(): boolean {
	return useWorktreeStore((state) => state.isGitRepo);
}

export function getDisplayName(worktree: WorktreeInfo): string {
	return worktree.is_main ? worktree.branch : worktree.name;
}

export function resetWorktreeStore() {
	worktreeActions.reset();
}
