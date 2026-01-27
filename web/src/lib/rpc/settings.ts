import type { JSONRPCRequester } from "json-rpc-2.0";
import type { Settings } from "../../types/settings";

export interface SettingsActions {
	updateSettings: (settings: Settings) => Promise<void>;
}

export function createSettingsActions(
	getClient: () => JSONRPCRequester<void> | null,
): SettingsActions {
	const requireClient = (): JSONRPCRequester<void> => {
		const client = getClient();
		if (!client) {
			throw new Error("Not connected");
		}
		return client;
	};

	return {
		updateSettings: async (settings: Settings): Promise<void> => {
			await requireClient().request("settings.update", { settings });
		},
	};
}
