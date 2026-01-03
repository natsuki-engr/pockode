import { create } from "zustand";

interface UnreadState {
	unreadSessionIds: Set<string>;
}

export const useUnreadStore = create<UnreadState>(() => ({
	unreadSessionIds: new Set(),
}));

export const unreadActions = {
	markUnread: (sessionId: string) => {
		useUnreadStore.setState((state) => {
			if (state.unreadSessionIds.has(sessionId)) return state;
			const next = new Set(state.unreadSessionIds);
			next.add(sessionId);
			return { unreadSessionIds: next };
		});
	},

	markRead: (sessionId: string) => {
		useUnreadStore.setState((state) => {
			if (!state.unreadSessionIds.has(sessionId)) return state;
			const next = new Set(state.unreadSessionIds);
			next.delete(sessionId);
			return { unreadSessionIds: next };
		});
	},
};

export function useHasUnread(sessionId: string): boolean {
	return useUnreadStore((state) => state.unreadSessionIds.has(sessionId));
}
