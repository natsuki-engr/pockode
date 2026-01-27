export interface Settings {
	sandbox: boolean;
}

export interface SettingsSubscribeResult {
	id: string;
	settings: Settings;
}

export interface SettingsChangedNotification {
	id: string;
	settings: Settings;
}
