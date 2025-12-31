import { ArrowDown } from "lucide-react";
import { useEffect, useRef } from "react";
import { useStickToBottom } from "../../hooks/useStickToBottom";
import type {
	AskUserQuestionRequest,
	Message,
	PermissionRequest,
} from "../../types/message";
import MessageItem, { type PermissionChoice } from "./MessageItem";

interface Props {
	messages: Message[];
	sessionId: string;
	isProcessRunning: boolean;
	onPermissionRespond?: (
		request: PermissionRequest,
		choice: PermissionChoice,
	) => void;
	onQuestionRespond?: (
		request: AskUserQuestionRequest,
		answers: Record<string, string> | null,
	) => void;
}

function MessageList({
	messages,
	sessionId,
	isProcessRunning,
	onPermissionRespond,
	onQuestionRespond,
}: Props) {
	const containerRef = useRef<HTMLDivElement>(null);

	const { isScrolledUp, scrollToBottom, resetToBottom } = useStickToBottom(
		containerRef,
		true, // Always enabled since containerRef is always attached
	);

	// Reset to bottom when switching sessions
	// biome-ignore lint/correctness/useExhaustiveDependencies: sessionId change should reset scroll
	useEffect(() => {
		resetToBottom();
	}, [sessionId]);

	return (
		<div className="relative min-h-0 flex-1">
			<div
				ref={containerRef}
				className="flex h-full flex-col overflow-y-auto overscroll-contain p-3 sm:p-4"
			>
				{messages.length === 0 ? (
					<div className="flex flex-1 items-center justify-center text-th-text-muted">
						<p>Start a conversation...</p>
					</div>
				) : (
					<>
						{/* Spacer to push messages to bottom when content is short */}
						<div className="flex-1" aria-hidden="true" />
						{/* Messages container */}
						<div className="space-y-3 sm:space-y-4">
							{messages.map((message, index) => (
								<MessageItem
									key={message.id}
									message={message}
									isLast={index === messages.length - 1}
									isProcessRunning={isProcessRunning}
									onPermissionRespond={onPermissionRespond}
									onQuestionRespond={onQuestionRespond}
								/>
							))}
						</div>
					</>
				)}
			</div>
			{isScrolledUp && (
				<button
					type="button"
					onClick={scrollToBottom}
					className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-th-border bg-th-bg-primary p-2 text-th-text-secondary shadow-xl transition-colors hover:bg-th-bg-secondary hover:text-th-text-primary"
					aria-label="Scroll to bottom"
				>
					<ArrowDown className="h-5 w-5" aria-hidden="true" />
				</button>
			)}
		</div>
	);
}

export default MessageList;
