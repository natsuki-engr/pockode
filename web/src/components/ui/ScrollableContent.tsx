import { useEffect, useRef, useState } from "react";

interface Props {
	children: React.ReactNode;
	className?: string;
}

/** Scrollable container with bottom scroll indicator */
function ScrollableContent({ children, className }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [canScrollDown, setCanScrollDown] = useState(false);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const checkScroll = () => {
			const isScrollable = el.scrollHeight > el.clientHeight;
			const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
			setCanScrollDown(isScrollable && !isAtBottom);
		};

		checkScroll();
		el.addEventListener("scroll", checkScroll, { passive: true });

		const resizeObserver = new ResizeObserver(checkScroll);
		resizeObserver.observe(el);

		const mutationObserver = new MutationObserver(checkScroll);
		mutationObserver.observe(el, {
			childList: true,
			subtree: true,
			characterData: true,
		});

		return () => {
			el.removeEventListener("scroll", checkScroll);
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	}, []);

	return (
		<div className="relative">
			<div ref={containerRef} className={className}>
				{children}
			</div>
			{canScrollDown && (
				<div className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-8 items-end justify-center bg-gradient-to-t from-white/60 to-transparent pb-0.5 dark:from-black/50">
					<svg
						aria-hidden="true"
						className="h-3.5 w-3.5 text-th-text-muted"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2.5}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</div>
			)}
		</div>
	);
}

export default ScrollableContent;
