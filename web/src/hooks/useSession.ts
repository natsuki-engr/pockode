import { useMutation } from "@tanstack/react-query";
import {
	prependSession,
	useFilteredSessions,
	useSessionStore,
} from "../lib/sessionStore";
import { useSettingsStore } from "../lib/settingsStore";
import { wsActions } from "../lib/wsStore";
import { useSessionSubscription } from "./useSessionSubscription";

interface UseSessionOptions {
	enabled?: boolean;
	/** Session ID from URL */
	routeSessionId?: string | null;
}

export function useSession({
	enabled = true,
	routeSessionId,
}: UseSessionOptions = {}) {
	const sessions = useFilteredSessions();
	const sessionStoreLoading = useSessionStore((s) => s.isLoading);
	const sessionStoreSuccess = useSessionStore((s) => s.isSuccess);
	const settingsLoaded = useSettingsStore((s) => s.settings !== null);
	const updateSessions = useSessionStore((s) => s.updateSessions);

	// Both sessions and settings must be loaded before we consider data ready
	const isLoading = sessionStoreLoading || !settingsLoaded;
	const isSuccess = sessionStoreSuccess && settingsLoaded;
	const { refresh } = useSessionSubscription(enabled);

	const createMutation = useMutation({
		mutationFn: wsActions.createSession,
		onSuccess: (newSession) => {
			// Optimistically add session to avoid redirect race condition.
			// The subscription notification will deduplicate.
			updateSessions((old) => prependSession(old, newSession));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: wsActions.deleteSession,
	});

	const updateTitleMutation = useMutation({
		mutationFn: ({ id, title }: { id: string; title: string }) =>
			wsActions.updateSessionTitle(id, title),
	});

	const currentSessionId = routeSessionId ?? null;
	const currentSession = sessions.find((s) => s.id === currentSessionId);

	const redirectSessionId = (() => {
		if (!isSuccess) return null;
		if (currentSessionId && currentSession) return null;
		if (sessions.length > 0) return sessions[0].id;
		return null;
	})();

	const needsNewSession = isSuccess && sessions.length === 0;

	return {
		sessions,
		currentSessionId,
		currentSession,
		isLoading,
		isSuccess,
		redirectSessionId,
		needsNewSession,
		refresh,
		createSession: () => createMutation.mutateAsync(),
		deleteSession: (id: string) => deleteMutation.mutateAsync(id),
		updateTitle: (id: string, title: string) =>
			updateTitleMutation.mutate({ id, title }),
	};
}
