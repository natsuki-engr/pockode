import { useCallback, useEffect, useRef } from "react";
import { prependSession, useSessionStore } from "../lib/sessionStore";
import { useWSStore } from "../lib/wsStore";
import type { SessionListChangedNotification } from "../types/message";

/**
 * Manages WebSocket subscription to the session list.
 * Handles subscribe/unsubscribe lifecycle and notification processing.
 */
export function useSessionSubscription(enabled: boolean) {
	const wsStatus = useWSStore((s) => s.status);
	const sessionListSubscribe = useWSStore(
		(s) => s.actions.sessionListSubscribe,
	);
	const sessionListUnsubscribe = useWSStore(
		(s) => s.actions.sessionListUnsubscribe,
	);

	const setSessions = useSessionStore((s) => s.setSessions);
	const updateSessions = useSessionStore((s) => s.updateSessions);
	const reset = useSessionStore((s) => s.reset);

	const isConnected = wsStatus === "connected";
	const watchIdRef = useRef<string | null>(null);
	const cancelledRef = useRef(false);

	const handleNotification = useCallback(
		(params: SessionListChangedNotification) => {
			updateSessions((old) => {
				switch (params.operation) {
					case "create":
						return prependSession(old, params.session);
					case "update":
						return old.map((s) =>
							s.id === params.session.id ? params.session : s,
						);
					case "delete":
						return old.filter((s) => s.id !== params.sessionId);
				}
			});
		},
		[updateSessions],
	);

	const resubscribe = useCallback(async () => {
		if (watchIdRef.current) {
			await sessionListUnsubscribe(watchIdRef.current);
			watchIdRef.current = null;
		}

		if (cancelledRef.current) return;

		try {
			const result = await sessionListSubscribe(handleNotification);

			if (cancelledRef.current) {
				await sessionListUnsubscribe(result.id);
				return;
			}

			watchIdRef.current = result.id;
			setSessions(result.sessions);
		} catch (error) {
			console.error("Failed to subscribe to session list:", error);
			if (!cancelledRef.current) {
				reset();
			}
		}
	}, [
		sessionListSubscribe,
		sessionListUnsubscribe,
		handleNotification,
		setSessions,
		reset,
	]);

	useEffect(() => {
		if (!enabled || !isConnected) {
			reset();
			return;
		}

		cancelledRef.current = false;
		resubscribe();

		return () => {
			cancelledRef.current = true;
			if (watchIdRef.current) {
				sessionListUnsubscribe(watchIdRef.current);
				watchIdRef.current = null;
			}
		};
	}, [enabled, isConnected, resubscribe, sessionListUnsubscribe, reset]);

	return { refresh: resubscribe };
}
