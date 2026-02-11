import { afterEach, describe, expect, it, vi } from "vitest";
import { resetSettingsSections } from "./registries/settingsRegistry";

describe("extensions", () => {
	afterEach(async () => {
		vi.resetModules();
		resetSettingsSections();
	});

	it("loads an extension", async () => {
		const { loadExtension, unloadExtension } = await import("./extensions");

		const activate = vi.fn();
		loadExtension({ id: "test", activate });

		expect(activate).toHaveBeenCalledTimes(1);
		expect(activate).toHaveBeenCalledWith(
			expect.objectContaining({ id: "test" }),
		);

		unloadExtension("test");
	});

	it("prevents duplicate loading", async () => {
		const { loadExtension, unloadExtension } = await import("./extensions");
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const activate = vi.fn();
		loadExtension({ id: "test", activate });
		loadExtension({ id: "test", activate });

		expect(activate).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith('Extension "test" already loaded');

		warnSpy.mockRestore();
		unloadExtension("test");
	});

	it("unloads an extension and calls dispose", async () => {
		const { loadExtension, unloadExtension } = await import("./extensions");
		const { getSettingsSections } = await import(
			"./registries/settingsRegistry"
		);

		loadExtension({
			id: "test",
			activate: (ctx) => {
				ctx.settings.register({
					id: "test-section",
					label: "Test",
					priority: 10,
					component: () => null,
				});
			},
		});

		expect(getSettingsSections()).toHaveLength(1);

		const result = unloadExtension("test");
		expect(result).toBe(true);
		expect(getSettingsSections()).toHaveLength(0);
	});

	it("returns false when unloading non-existent extension", async () => {
		const { unloadExtension } = await import("./extensions");

		const result = unloadExtension("non-existent");
		expect(result).toBe(false);
	});
});
