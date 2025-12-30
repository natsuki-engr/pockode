import { Trash2 } from "lucide-react";
import type { SessionMeta } from "../../types/message";

interface Props {
	session: SessionMeta;
	isActive: boolean;
	onSelect: () => void;
	onDelete: () => void;
}

function SessionItem({ session, isActive, onSelect, onDelete }: Props) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className={`group flex w-full cursor-pointer items-center justify-between rounded-lg p-3 text-left ${
				isActive
					? "bg-th-accent text-th-accent-text"
					: "text-th-text-secondary hover:bg-th-bg-tertiary"
			}`}
		>
			<div className="min-w-0 flex-1">
				<div className="truncate font-medium">{session.title}</div>
				<div
					className={`text-xs ${isActive ? "opacity-70" : "text-th-text-muted"}`}
				>
					{new Date(session.created_at).toLocaleDateString()}
				</div>
			</div>
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onDelete();
				}}
				className={`ml-2 rounded p-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 ${
					isActive ? "hover:bg-th-accent-hover" : "hover:bg-th-bg-secondary"
				}`}
				aria-label="Delete session"
			>
				<Trash2 className="h-4 w-4" aria-hidden="true" />
			</button>
		</button>
	);
}

export default SessionItem;
