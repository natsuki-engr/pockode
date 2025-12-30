import { GitCompare, type LucideIcon, MessageSquare } from "lucide-react";

type Tab = "sessions" | "diff";

interface Props {
	activeTab: Tab;
	onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
	{ id: "sessions", label: "Sessions", icon: MessageSquare },
	{ id: "diff", label: "Diff", icon: GitCompare },
];

function SidebarTabs({ activeTab, onTabChange }: Props) {
	return (
		<div className="flex border-b border-th-border">
			{TABS.map((tab) => {
				const Icon = tab.icon;
				return (
					<button
						key={tab.id}
						type="button"
						onClick={() => onTabChange(tab.id)}
						className={`flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
							activeTab === tab.id
								? "border-b-2 border-th-accent text-th-accent"
								: "text-th-text-muted hover:text-th-text-primary"
						}`}
					>
						<Icon className="h-4 w-4" aria-hidden="true" />
						{tab.label}
					</button>
				);
			})}
		</div>
	);
}

export default SidebarTabs;
export type { Tab };
