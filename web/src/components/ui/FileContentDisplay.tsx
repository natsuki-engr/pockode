import {
	CodeHighlighter,
	getLanguageFromPath,
	isMarkdownFile,
} from "../../lib/shikiUtils";
import { MarkdownContent } from "../Chat/MarkdownContent";

interface Props {
	content: string;
	filePath?: string;
}

export function FileContentDisplay({ content, filePath }: Props) {
	if (filePath && isMarkdownFile(filePath)) {
		return <MarkdownContent content={content} />;
	}

	const language = filePath ? getLanguageFromPath(filePath) : undefined;
	return <CodeHighlighter language={language}>{content}</CodeHighlighter>;
}
