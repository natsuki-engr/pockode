import { Trash2 } from "lucide-react";
import { useHasUnread } from "../../lib/unreadStore";
import type { SessionMeta } from "../../types/message";

interface Props {
	session: SessionMeta;
	isActive: boolean;
	onSelect: () => void;
	onDelete: () => void;
}

function SessionItem({ session, isActive, onSelect, onDelete }: Props) {
	const hasUnread = useHasUnread(session.id);

	return (
		<button
			type="button"
			onClick={onSelect}
			className={`group flex w-full cursor-pointer items-center justify-between rounded-lg p-3 text-left transition-colors ${
				isActive
					? "border-l-2 border-th-accent bg-th-bg-tertiary text-th-text-primary"
					: hasUnread
						? "bg-th-bg-tertiary text-th-text-primary"
						: "text-th-text-secondary hover:bg-th-bg-tertiary"
			}`}
		>
			<div className="min-w-0 flex-1">
				<div className={`truncate ${hasUnread ? "font-semibold" : ""}`}>
					{session.title}
				</div>
				<div className="text-xs text-th-text-muted">
					{new Date(session.created_at).toLocaleDateString()}
				</div>
			</div>
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onDelete();
				}}
				className="ml-2 rounded p-1 transition-opacity hover:bg-th-bg-secondary sm:opacity-0 sm:group-hover:opacity-100"
				aria-label="Delete session"
			>
				<Trash2 className="h-4 w-4" aria-hidden="true" />
			</button>
		</button>
	);
}

export default SessionItem;
