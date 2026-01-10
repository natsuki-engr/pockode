import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { contentsQueryKey, useContents } from "../../hooks/useContents";
import { useFSWatch } from "../../hooks/useFSWatch";
import { isFileContent } from "../../types/contents";
import { ContentView, FileContentDisplay } from "../ui";

interface Props {
	path: string;
	onBack: () => void;
}

function FileView({ path, onBack }: Props) {
	const queryClient = useQueryClient();
	const { data, isLoading, error } = useContents(path);

	useFSWatch(
		path,
		useCallback(() => {
			queryClient.invalidateQueries({ queryKey: contentsQueryKey(path) });
		}, [queryClient, path]),
	);

	const content = useMemo(() => {
		if (!data || !isFileContent(data)) return null;

		const ext = path.split(".").pop()?.toLowerCase();

		if (data.encoding === "text" && ext === "svg") {
			return (
				<div className="flex items-center justify-center p-4">
					<img
						src={`data:image/svg+xml,${encodeURIComponent(data.content)}`}
						alt={path}
						className="max-w-full max-h-[70vh] object-contain"
					/>
				</div>
			);
		}

		if (data.encoding === "base64") {
			const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext ?? "");

			if (isImage) {
				const mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;
				return (
					<div className="flex items-center justify-center p-4">
						<img
							src={`data:${mimeType};base64,${data.content}`}
							alt={path}
							className="max-w-full max-h-[70vh] object-contain"
						/>
					</div>
				);
			}

			return (
				<div className="p-4 text-center text-th-text-muted">
					Binary file cannot be displayed
				</div>
			);
		}

		return (
			<div className="p-2">
				<FileContentDisplay content={data.content} filePath={path} />
			</div>
		);
	}, [data, path]);

	return (
		<ContentView
			path={path}
			isLoading={isLoading}
			error={error instanceof Error ? error : null}
			onBack={onBack}
		>
			{content}
		</ContentView>
	);
}

export default FileView;
