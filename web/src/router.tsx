import {
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { z } from "zod";
import AppShell from "./components/AppShell";

const overlaySearchSchema = z.object({
	session: z.string().optional(),
});

export type OverlaySearchParams = z.infer<typeof overlaySearchSchema>;

const rootRoute = createRootRoute({
	component: AppShell,
});

const sessionRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/s/$sessionId",
});

const stagedDiffRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/staged/$",
	validateSearch: (search) => overlaySearchSchema.parse(search),
});

const unstagedDiffRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/unstaged/$",
	validateSearch: (search) => overlaySearchSchema.parse(search),
});

const fileViewRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/files/$",
	validateSearch: (search) => overlaySearchSchema.parse(search),
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
});

const routeTree = rootRoute.addChildren([
	indexRoute,
	sessionRoute,
	stagedDiffRoute,
	unstagedDiffRoute,
	fileViewRoute,
]);

export const router = createRouter({
	routeTree,
	defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
