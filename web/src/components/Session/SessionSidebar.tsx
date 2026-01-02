import { FolderOpen, GitCompare, MessageSquare } from "lucide-react";
import { FilesTab } from "../Files";
import { DiffTab } from "../Git";
import { TabbedSidebar, type TabConfig } from "../Layout";
import SessionsTab from "./SessionsTab";

const TABS: TabConfig[] = [
	{ id: "sessions", label: "Sessions", icon: MessageSquare },
	{ id: "files", label: "Files", icon: FolderOpen },
	{ id: "diff", label: "Diff", icon: GitCompare },
];

interface Props {
	isOpen: boolean;
	onClose: () => void;
	currentSessionId: string | null;
	onSelectSession: (id: string) => void;
	onCreateSession: () => void;
	onDeleteSession: (id: string) => void;
	onSelectDiffFile: (path: string, staged: boolean) => void;
	activeDiffFile: { path: string; staged: boolean } | null;
	onSelectFile: (path: string) => void;
	activeFilePath: string | null;
	isDesktop: boolean;
}

function SessionSidebar({
	isOpen,
	onClose,
	currentSessionId,
	onSelectSession,
	onCreateSession,
	onDeleteSession,
	onSelectDiffFile,
	activeDiffFile,
	onSelectFile,
	activeFilePath,
	isDesktop,
}: Props) {
	const handleSelectSession = (id: string) => {
		onSelectSession(id);
		if (!isDesktop) onClose();
	};

	const handleSelectDiffFile = (path: string, staged: boolean) => {
		onSelectDiffFile(path, staged);
		if (!isDesktop) onClose();
	};

	const handleSelectFile = (path: string) => {
		onSelectFile(path);
		if (!isDesktop) onClose();
	};

	return (
		<TabbedSidebar
			isOpen={isOpen}
			onClose={onClose}
			title="Pockode"
			tabs={TABS}
			defaultTab="sessions"
			isDesktop={isDesktop}
		>
			<SessionsTab
				currentSessionId={currentSessionId}
				onSelectSession={handleSelectSession}
				onCreateSession={onCreateSession}
				onDeleteSession={onDeleteSession}
			/>
			<FilesTab
				onSelectFile={handleSelectFile}
				activeFilePath={activeFilePath}
			/>
			<DiffTab
				onSelectFile={handleSelectDiffFile}
				activeFile={activeDiffFile}
			/>
		</TabbedSidebar>
	);
}

export default SessionSidebar;
