import { ChevronRight } from "lucide-react";
import type { FileStatus } from "../../types/git";
import { splitPath } from "../../utils/path";

interface Props {
	file: FileStatus;
	onSelect: () => void;
	isActive: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
	M: { label: "Modified", color: "text-th-warning" },
	A: { label: "Added", color: "text-th-success" },
	D: { label: "Deleted", color: "text-th-error" },
	R: { label: "Renamed", color: "text-th-accent" },
	"?": { label: "Untracked", color: "text-th-text-muted" },
};

function DiffFileItem({ file, onSelect, isActive }: Props) {
	const statusInfo = STATUS_LABELS[file.status] || STATUS_LABELS["?"];
	const { fileName, directory } = splitPath(file.path);

	return (
		<button
			type="button"
			onClick={onSelect}
			className={`flex w-full min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-left text-th-text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-th-accent focus-visible:ring-offset-1 focus-visible:ring-offset-th-bg-secondary ${
				isActive
					? "bg-th-bg-tertiary border-l-2 border-th-accent"
					: "hover:bg-th-bg-tertiary"
			}`}
			aria-label={`View ${statusInfo.label.toLowerCase()} file: ${file.path}`}
		>
			<span
				className={`shrink-0 self-start mt-0.5 text-xs font-medium ${statusInfo.color}`}
				title={statusInfo.label}
			>
				{file.status}
			</span>
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium text-th-text-primary">
					{fileName}
				</div>
				{directory && (
					<div className="truncate text-xs text-th-text-muted">{directory}</div>
				)}
			</div>
			<ChevronRight
				className="h-4 w-4 shrink-0 text-th-text-muted"
				aria-hidden="true"
			/>
		</button>
	);
}

export default DiffFileItem;
