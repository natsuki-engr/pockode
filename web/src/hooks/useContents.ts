import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { getContents } from "../lib/contentsApi";

interface UseContentsOptions {
	enabled?: boolean;
	refreshSignal?: number;
}

export function useContents(path = "", options: UseContentsOptions = {}) {
	const { enabled = true, refreshSignal } = options;
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: ["contents", path],
		queryFn: () => getContents(path),
		enabled,
		staleTime: Infinity,
	});

	const refresh = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["contents", path] });
	}, [queryClient, path]);

	useEffect(() => {
		if (refreshSignal && enabled) {
			refresh();
		}
	}, [refreshSignal, enabled, refresh]);

	return { ...query, refresh };
}
