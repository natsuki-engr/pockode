import { Loader2, Minus, Plus } from "lucide-react";
import type { FileStatus } from "../../types/git";
import { splitPath } from "../../utils/path";
import SidebarListItem from "../common/SidebarListItem";

interface Props {
	file: FileStatus;
	staged: boolean;
	onSelect: () => void;
	onToggleStage: () => void;
	isActive: boolean;
	isToggling?: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
	M: { label: "Modified", color: "text-th-warning" },
	A: { label: "Added", color: "text-th-success" },
	D: { label: "Deleted", color: "text-th-error" },
	R: { label: "Renamed", color: "text-th-accent" },
	"?": { label: "Untracked", color: "text-th-text-muted" },
};

function DiffFileItem({
	file,
	staged,
	onSelect,
	onToggleStage,
	isActive,
	isToggling,
}: Props) {
	const statusInfo = STATUS_LABELS[file.status] || STATUS_LABELS["?"];
	const { fileName, directory } = splitPath(file.path);

	const Icon = staged ? Minus : Plus;
	const actionLabel = staged ? "Unstage file" : "Stage file";

	return (
		<SidebarListItem
			title={fileName}
			subtitle={directory}
			isActive={isActive}
			onSelect={onSelect}
			ariaLabel={`View ${statusInfo.label.toLowerCase()} file: ${file.path}`}
			leftSlot={
				<span
					className={`shrink-0 self-start mt-0.5 text-xs font-medium ${statusInfo.color}`}
					title={statusInfo.label}
				>
					{file.status}
				</span>
			}
			actions={
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onToggleStage();
					}}
					disabled={isToggling}
					className={`flex items-center justify-center min-h-[36px] min-w-[36px] rounded-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-th-accent ${
						isToggling
							? "opacity-50 cursor-not-allowed text-th-text-muted"
							: "text-th-text-secondary hover:text-th-text-primary active:scale-95"
					}`}
					aria-label={actionLabel}
				>
					{isToggling ? (
						<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
					) : (
						<Icon className="h-4 w-4" aria-hidden="true" />
					)}
				</button>
			}
		/>
	);
}

export default DiffFileItem;
