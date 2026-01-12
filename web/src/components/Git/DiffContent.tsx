import { memo } from "react";
import { DiffViewer } from "../ui";

interface Props {
	diff: string;
	fileName: string;
	oldContent: string;
	newContent: string;
}

const DiffContent = memo(function DiffContent({
	diff,
	fileName,
	oldContent,
	newContent,
}: Props) {
	if (/^Binary files .+ and .+ differ$/m.test(diff)) {
		return (
			<div className="p-4 text-center text-th-text-muted">
				Binary file - cannot display diff
			</div>
		);
	}

	if (!diff.trim()) {
		return <div className="p-4 text-center text-th-text-muted">No changes</div>;
	}

	return (
		<DiffViewer
			fileName={fileName}
			hunks={[diff]}
			oldContent={oldContent}
			newContent={newContent}
		/>
	);
});

export default DiffContent;
