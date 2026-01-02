import { useSidebarRefresh } from "../Layout";
import FileTree from "./FileTree";

interface Props {
	onSelectFile: (path: string) => void;
	activeFilePath: string | null;
}

function FilesTab({ onSelectFile, activeFilePath }: Props) {
	const { isActive, refreshSignal } = useSidebarRefresh("files");

	if (!isActive) return null;

	return (
		<FileTree
			onSelectFile={onSelectFile}
			activeFilePath={activeFilePath}
			refreshSignal={refreshSignal}
		/>
	);
}

export default FilesTab;
