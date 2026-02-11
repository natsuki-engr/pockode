import type { ExtensionContext } from "../../lib/extensions";
import AboutSection from "./settings/AboutSection";

export const id = "example-extension";

export function activate(ctx: ExtensionContext) {
	ctx.settings.register({
		id: "about",
		label: "About",
		priority: 200,
		component: AboutSection,
	});
}
