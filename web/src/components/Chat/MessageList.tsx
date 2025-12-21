import { useEffect, useRef } from "react";
import type { Message } from "../../types/message";
import MessageItem from "./MessageItem";

interface Props {
	messages: Message[];
}

function MessageList({ messages }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const endRef = useRef<HTMLDivElement>(null);
	const userScrolledUp = useRef(false);

	// Detect user scroll: if scrolling away from bottom, mark as scrolled up
	const handleScroll = () => {
		const container = containerRef.current;
		if (!container) return;

		const threshold = 50;
		const distanceFromBottom =
			container.scrollHeight - container.scrollTop - container.clientHeight;

		if (distanceFromBottom > threshold) {
			userScrolledUp.current = true;
		} else {
			userScrolledUp.current = false;
		}
	};

	// Auto scroll to bottom only if user hasn't scrolled up
	// biome-ignore lint/correctness/useExhaustiveDependencies: messages triggers scroll on any update
	useEffect(() => {
		if (!userScrolledUp.current) {
			endRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	return (
		<div
			ref={containerRef}
			onScroll={handleScroll}
			className="flex-1 space-y-4 overflow-y-auto p-4"
		>
			{messages.length === 0 && (
				<div className="flex h-full items-center justify-center text-gray-500">
					<p>Start a conversation...</p>
				</div>
			)}
			{messages.map((message) => (
				<MessageItem key={message.id} message={message} />
			))}
			<div ref={endRef} />
		</div>
	);
}

export default MessageList;
