import { useEffect, useRef } from "react";
import { useWSStore } from "../lib/wsStore";

/**
 * Watch a file or directory for changes.
 * When a change is detected, the callback is invoked.
 *
 * @param path - The path to watch (relative to workDir), or null to disable
 * @param onChanged - Callback to invoke when the file/directory changes
 */
export function useFSWatch(path: string | null, onChanged: () => void): void {
	const watchSubscribe = useWSStore((s) => s.actions.watchSubscribe);
	const watchUnsubscribe = useWSStore((s) => s.actions.watchUnsubscribe);
	const status = useWSStore((s) => s.status);

	// Keep callback ref up to date without triggering effect
	const onChangedRef = useRef(onChanged);
	onChangedRef.current = onChanged;

	useEffect(() => {
		if (path === null || status !== "connected") return;

		let watchId: string | null = null;
		let cancelled = false;

		watchSubscribe(path, () => {
			onChangedRef.current();
		})
			.then((id) => {
				if (cancelled) {
					// Component unmounted before subscribe completed
					watchUnsubscribe(id);
				} else {
					watchId = id;
				}
			})
			.catch((err) => {
				console.error("Failed to subscribe to watch:", path, err);
			});

		return () => {
			cancelled = true;
			if (watchId) {
				watchUnsubscribe(watchId);
			}
		};
	}, [path, status, watchSubscribe, watchUnsubscribe]);
}
