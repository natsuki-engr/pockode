import { describe, expect, it } from "vitest";
import { splitPath } from "./path";

describe("splitPath", () => {
	it("splits path with directory", () => {
		expect(splitPath("src/components/Button.tsx")).toEqual({
			fileName: "Button.tsx",
			directory: "src/components/",
		});
	});

	it("returns filename only when no directory", () => {
		expect(splitPath("README.md")).toEqual({
			fileName: "README.md",
			directory: "",
		});
	});
});
