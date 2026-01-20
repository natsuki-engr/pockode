import { create } from "zustand";
import type { SessionMeta } from "../types/message";

interface SessionState {
	sessions: SessionMeta[];
	isLoading: boolean;
	isSuccess: boolean;
}

interface SessionActions {
	setSessions: (sessions: SessionMeta[]) => void;
	updateSessions: (updater: (old: SessionMeta[]) => SessionMeta[]) => void;
	reset: () => void;
}

export type SessionStore = SessionState & SessionActions;

export const useSessionStore = create<SessionStore>((set) => ({
	sessions: [],
	isLoading: true,
	isSuccess: false,
	setSessions: (sessions) =>
		set({ sessions, isLoading: false, isSuccess: true }),
	updateSessions: (updater) =>
		set((state) => ({ sessions: updater(state.sessions) })),
	reset: () => set({ sessions: [], isLoading: false, isSuccess: false }),
}));

/**
 * Prepend a session to the list, removing any existing session with the same ID.
 * Used for both create notifications and optimistic updates.
 */
export function prependSession(
	sessions: SessionMeta[],
	session: SessionMeta,
): SessionMeta[] {
	return [session, ...sessions.filter((s) => s.id !== session.id)];
}
