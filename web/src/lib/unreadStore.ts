import { create } from "zustand";

interface UnreadState {
	unreadSessionIds: Set<string>;
	viewingSessionId: string | null;
}

export const useUnreadStore = create<UnreadState>(() => ({
	unreadSessionIds: new Set(),
	viewingSessionId: null,
}));

export const unreadActions = {
	setViewingSession: (sessionId: string | null) => {
		useUnreadStore.setState({ viewingSessionId: sessionId });
	},

	isViewing: (sessionId: string) => {
		return useUnreadStore.getState().viewingSessionId === sessionId;
	},

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

export function useHasAnyUnread(): boolean {
	return useUnreadStore((state) => state.unreadSessionIds.size > 0);
}

// Reset function for testing
export function resetUnreadStore() {
	useUnreadStore.setState({
		unreadSessionIds: new Set(),
		viewingSessionId: null,
	});
}
