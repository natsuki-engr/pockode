import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import {
	createSession,
	deleteSession,
	updateSessionTitle,
} from "../lib/sessionApi";
import { prependSession, useSessionStore } from "../lib/sessionStore";
import { setSessionExistsChecker } from "../lib/wsStore";
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
	const sessions = useSessionStore((s) => s.sessions);
	const isLoading = useSessionStore((s) => s.isLoading);
	const isSuccess = useSessionStore((s) => s.isSuccess);
	const updateSessions = useSessionStore((s) => s.updateSessions);
	const { refresh } = useSessionSubscription(enabled);

	// Register session existence checker for wsStore
	useEffect(() => {
		setSessionExistsChecker((sessionId) =>
			sessions.some((s) => s.id === sessionId),
		);
		return () => setSessionExistsChecker(null);
	}, [sessions]);

	const createMutation = useMutation({
		mutationFn: createSession,
		onSuccess: (newSession) => {
			// Optimistically add session to avoid redirect race condition.
			// The subscription notification will deduplicate.
			updateSessions((old) => prependSession(old, newSession));
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteSession,
	});

	const updateTitleMutation = useMutation({
		mutationFn: ({ id, title }: { id: string; title: string }) =>
			updateSessionTitle(id, title),
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
