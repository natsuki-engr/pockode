import { useEffect } from "react";
import { type ConnectionStatus, useWSStore } from "../lib/wsStore";
import type { WSClientMessage, WSServerMessage } from "../types/message";

interface UseWebSocketOptions {
	onMessage: (message: WSServerMessage) => void;
}

interface UseWebSocketReturn {
	status: ConnectionStatus;
	send: (message: WSClientMessage) => boolean;
	disconnect: () => void;
}

export type { ConnectionStatus };

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
	const { onMessage } = options;

	// Subscribe to connection status via Zustand selector
	const status = useWSStore((state) => state.status);

	// Subscribe to messages
	useEffect(() => {
		const { subscribeMessage } = useWSStore.getState();
		return subscribeMessage(onMessage);
	}, [onMessage]);

	// Connect on mount (only once per app lifecycle)
	useEffect(() => {
		const { status: currentStatus, connect } = useWSStore.getState();
		if (currentStatus === "disconnected") {
			connect();
		}
	}, []);

	return {
		status,
		send: useWSStore.getState().send,
		disconnect: useWSStore.getState().disconnect,
	};
}
