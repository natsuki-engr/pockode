import { DiffModeEnum, DiffView } from "@git-diff-view/react";
import { getDiffViewHighlighter } from "@git-diff-view/shiki";
import "@git-diff-view/react/styles/diff-view-pure.css";
import { useEffect, useState } from "react";

interface Props {
	diff: string;
	fileName: string;
}

// Cache the highlighter instance globally
let highlighterPromise: ReturnType<typeof getDiffViewHighlighter> | null = null;

function getHighlighter() {
	if (!highlighterPromise) {
		highlighterPromise = getDiffViewHighlighter();
	}
	return highlighterPromise;
}

function DiffContent({ diff, fileName }: Props) {
	const [highlighter, setHighlighter] = useState<Awaited<
		ReturnType<typeof getDiffViewHighlighter>
	> | null>(null);

	useEffect(() => {
		getHighlighter().then(setHighlighter);
	}, []);

	// Check for binary file (git outputs "Binary files a/... and b/... differ")
	if (/^Binary files .+ and .+ differ$/m.test(diff)) {
		return (
			<div className="p-4 text-center text-th-text-muted">
				Binary file - cannot display diff
			</div>
		);
	}

	if (!diff.trim()) {
		return (
			<div className="p-4 text-center text-th-text-muted">
				No diff content to display
			</div>
		);
	}

	if (!highlighter) {
		return <div className="p-4 text-center text-th-text-muted">Loading...</div>;
	}

	return (
		<div className="diff-view-wrapper diff-tailwindcss-wrapper">
			<DiffView
				data={{
					oldFile: { fileName },
					newFile: { fileName },
					hunks: [diff],
				}}
				registerHighlighter={highlighter}
				diffViewMode={DiffModeEnum.Unified}
				diffViewTheme="dark"
				diffViewHighlight
				diffViewWrap
			/>
		</div>
	);
}

export default DiffContent;
