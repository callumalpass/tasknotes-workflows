import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
	test: {
		environment: "node",
	},
	resolve: {
		alias: {
			obsidian: resolve(import.meta.dirname, "tests/__mocks__/obsidian.ts"),
		},
	},
});
