import { useCallback } from "react";
import { useSettingsStore } from "../lib/settingsStore";
import { useWSStore } from "../lib/wsStore";
import type { Settings, SettingsChangedNotification } from "../types/settings";
import { useSubscription } from "./useSubscription";

/**
 * Manages WebSocket subscription to settings.
 * Handles subscribe/unsubscribe lifecycle and notification processing.
 * Settings is global (not worktree-specific), so it doesn't resubscribe on worktree change.
 */
export function useSettingsSubscription(enabled: boolean) {
	const settingsSubscribe = useWSStore((s) => s.actions.settingsSubscribe);
	const settingsUnsubscribe = useWSStore((s) => s.actions.settingsUnsubscribe);

	const setSettings = useSettingsStore((s) => s.setSettings);
	const reset = useSettingsStore((s) => s.reset);

	const handleNotification = useCallback(
		(params: SettingsChangedNotification) => {
			setSettings(params.settings);
		},
		[setSettings],
	);

	useSubscription<SettingsChangedNotification, Settings>(
		settingsSubscribe,
		settingsUnsubscribe,
		handleNotification,
		{
			enabled,
			resubscribeOnWorktreeChange: false,
			onSubscribed: setSettings,
			onReset: reset,
		},
	);
}
