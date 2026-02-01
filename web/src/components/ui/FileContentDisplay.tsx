import { CodeHighlighter, getLanguageFromPath } from "../../lib/shikiUtils";

interface Props {
	content: string;
	filePath?: string;
}

export function FileContentDisplay({ content, filePath }: Props) {
	const language = filePath ? getLanguageFromPath(filePath) : undefined;
	return <CodeHighlighter language={language}>{content}</CodeHighlighter>;
}
