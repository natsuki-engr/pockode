import {
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

interface UseStickToBottomResult {
	/** Whether user has scrolled away from bottom */
	isScrolledUp: boolean;
	/** Scroll to bottom with smooth animation */
	scrollToBottom: () => void;
	/** Reset state and scroll to bottom instantly (for session changes) */
	resetToBottom: () => void;
}

/**
 * Manages chat scroll behavior with a single source of truth.
 *
 * Principles:
 * - User's scroll intent is respected (if they scroll up, stay there)
 * - New content triggers auto-scroll only when already at bottom
 * - MutationObserver detects content changes (new messages, expanded content)
 */
export function useStickToBottom(
	containerRef: RefObject<HTMLElement | null>,
	enabled: boolean,
): UseStickToBottomResult {
	const [isScrolledUp, setIsScrolledUp] = useState(false);
	const isAtBottomRef = useRef(true);
	const isAutoScrollingRef = useRef(false);

	const checkIfAtBottom = useCallback(
		(container: HTMLElement, threshold = 50) => {
			const { scrollTop, scrollHeight, clientHeight } = container;
			return scrollHeight - scrollTop - clientHeight <= threshold;
		},
		[],
	);

	const scrollToBottom = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		isAutoScrollingRef.current = true;
		isAtBottomRef.current = true;
		setIsScrolledUp(false);

		container.scrollTo({
			top: container.scrollHeight,
			behavior: "smooth",
		});

		// Reset flag after animation
		setTimeout(() => {
			isAutoScrollingRef.current = false;
		}, 300);
	}, [containerRef]);

	const resetToBottom = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		isAutoScrollingRef.current = true;
		isAtBottomRef.current = true;
		setIsScrolledUp(false);

		// Instant scroll for session changes
		container.scrollTop = container.scrollHeight - container.clientHeight;

		requestAnimationFrame(() => {
			isAutoScrollingRef.current = false;
		});
	}, [containerRef]);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const container = containerRef.current;
		if (!container) return;

		// Check actual scroll position on init
		const atBottom = checkIfAtBottom(container);
		isAtBottomRef.current = atBottom;
		setIsScrolledUp(!atBottom);

		const handleScroll = () => {
			// Ignore programmatic scroll events
			if (isAutoScrollingRef.current) return;

			const atBottom = checkIfAtBottom(container);
			isAtBottomRef.current = atBottom;
			setIsScrolledUp(!atBottom);
		};

		// Use MutationObserver to detect content changes (new messages, expanded content)
		const mutationObserver = new MutationObserver(() => {
			if (!isAtBottomRef.current || isAutoScrollingRef.current) return;

			// Set flag to prevent handleScroll from interfering
			isAutoScrollingRef.current = true;
			container.scrollTop = container.scrollHeight - container.clientHeight;

			// Reset flag after scroll event processing
			requestAnimationFrame(() => {
				isAutoScrollingRef.current = false;
			});
		});

		// Observe all content changes within the container
		mutationObserver.observe(container, {
			childList: true,
			subtree: true,
			characterData: true,
		});

		container.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			container.removeEventListener("scroll", handleScroll);
			mutationObserver.disconnect();
		};
	}, [containerRef, enabled, checkIfAtBottom]);

	return {
		isScrolledUp,
		scrollToBottom,
		resetToBottom,
	};
}
