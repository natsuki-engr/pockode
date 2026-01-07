import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useHasUnread } from "../../lib/unreadStore";
import type { SessionMeta } from "../../types/message";
import ConfirmDialog from "../common/ConfirmDialog";

interface Props {
	session: SessionMeta;
	isActive: boolean;
	onSelect: () => void;
	onDelete: () => void;
}

function SessionItem({ session, isActive, onSelect, onDelete }: Props) {
	const hasUnread = useHasUnread(session.id);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	return (
		<div
			className={`group flex w-full items-center justify-between rounded-lg p-3 transition-colors ${
				isActive
					? "border-l-2 border-th-accent bg-th-bg-tertiary text-th-text-primary"
					: hasUnread
						? "bg-th-bg-tertiary text-th-text-primary"
						: "text-th-text-secondary hover:bg-th-bg-tertiary"
			}`}
		>
			<button
				type="button"
				onClick={() => {
					if (!showDeleteConfirm) {
						onSelect();
					}
				}}
				className="min-w-0 flex-1 cursor-pointer text-left"
			>
				<div className={`truncate ${hasUnread ? "font-semibold" : ""}`}>
					{session.title}
				</div>
				<div className="text-xs text-th-text-muted">
					{new Date(session.created_at).toLocaleDateString()}
				</div>
			</button>
			<button
				type="button"
				onClick={() => setShowDeleteConfirm(true)}
				className="ml-2 rounded p-1 transition-opacity hover:bg-th-bg-secondary sm:opacity-0 sm:group-hover:opacity-100"
				aria-label="Delete session"
			>
				<Trash2 className="h-4 w-4" aria-hidden="true" />
			</button>

			{showDeleteConfirm && (
				<ConfirmDialog
					title="Delete Session"
					message={`Are you sure you want to delete "${session.title}"? This action cannot be undone.`}
					confirmLabel="Delete"
					cancelLabel="Cancel"
					variant="danger"
					onConfirm={() => {
						setShowDeleteConfirm(false);
						onDelete();
					}}
					onCancel={() => setShowDeleteConfirm(false)}
				/>
			)}
		</div>
	);
}

export default SessionItem;
