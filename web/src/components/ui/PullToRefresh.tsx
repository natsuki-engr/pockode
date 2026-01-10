import { ArrowDown, Check, LoaderCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { type PullStatus, PullToRefreshify } from "react-pull-to-refreshify";

interface Props {
	onRefresh: () => Promise<void> | void;
	children: React.ReactNode;
	className?: string;
}

function PullToRefresh({ onRefresh, children, className = "" }: Props) {
	const [refreshing, setRefreshing] = useState(false);

	const handleRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await onRefresh();
		} finally {
			setRefreshing(false);
		}
	}, [onRefresh]);

	const renderText = useCallback((status: PullStatus, _percent: number) => {
		switch (status) {
			case "pulling":
				return <ArrowDown className="h-5 w-5 text-th-text-muted" />;
			case "canRelease":
				return <LoaderCircle className="h-5 w-5 text-th-accent" />;
			case "refreshing":
				return <LoaderCircle className="h-5 w-5 animate-spin text-th-accent" />;
			case "complete":
				return <Check className="h-5 w-5 text-th-accent" />;
			default:
				return null;
		}
	}, []);

	return (
		<PullToRefreshify
			refreshing={refreshing}
			onRefresh={handleRefresh}
			renderText={renderText}
			headHeight={50}
			threshold={60}
			className={className ? `flex-1 ${className}` : "flex-1"}
			style={{ height: "100%", overflowY: "auto" }}
		>
			{children}
		</PullToRefreshify>
	);
}

export default PullToRefresh;
