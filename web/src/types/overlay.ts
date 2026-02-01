export type OverlayState =
	| { type: "diff"; path: string; staged: boolean }
	| { type: "file"; path: string; edit?: boolean }
	| { type: "settings" }
	| null;
