import { create } from "zustand";
import type { Settings } from "../types/settings";

interface SettingsState {
	settings: Settings | null;
}

interface SettingsActions {
	setSettings: (settings: Settings) => void;
	reset: () => void;
}

export type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>((set) => ({
	settings: null,
	setSettings: (settings) => set({ settings }),
	reset: () => set({ settings: null }),
}));
