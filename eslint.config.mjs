import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import obsidianmd from "eslint-plugin-obsidianmd";
import prettier from "eslint-config-prettier";
import globals from "globals";

const sourceFilePatterns = ["main.ts", "src/**/*.ts"];

const obsidianRecommendedConfig = obsidianmd.configs.recommended.map((config) => {
	const hasUnscopedObsidianRules =
		config.files === undefined &&
		Object.keys(config.rules ?? {}).some((ruleName) => ruleName.startsWith("obsidianmd/"));

	if (!hasUnscopedObsidianRules) {
		return config;
	}

	return {
		...config,
		files: sourceFilePatterns,
	};
});

export default [
	{
		ignores: ["node_modules/**", "main.js", "coverage/**", "*.config.mjs", "*.config.ts"],
	},
	js.configs.recommended,
	...obsidianRecommendedConfig,
	{
		files: sourceFilePatterns,
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: "./tsconfig.json",
				sourceType: "module",
			},
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021,
			},
		},
		plugins: {
			"@typescript-eslint": tseslint,
		},
		rules: {
			...tseslint.configs.recommended.rules,
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-explicit-any": ["warn", { fixToUnknown: true }],
			"@typescript-eslint/no-floating-promises": "warn",
			"@typescript-eslint/no-misused-promises": "warn",
			"@typescript-eslint/no-non-null-assertion": "warn",
			"obsidianmd/no-static-styles-assignment": "warn",
			"obsidianmd/rule-custom-message": "warn",
			"obsidianmd/ui/sentence-case": "warn",
			"obsidianmd/no-forbidden-elements": "warn",
			"obsidianmd/platform": "off",
		},
	},
	{
		files: ["*.mjs"],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.es2021,
			},
		},
	},
	{
		files: ["tests/**/*.ts"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: "./tsconfig.json",
				sourceType: "module",
			},
			globals: {
				...globals.node,
				...globals.es2021,
			},
		},
		plugins: {
			"@typescript-eslint": tseslint,
		},
		rules: {
			...tseslint.configs.recommended.rules,
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": "warn",
			"obsidianmd/no-static-styles-assignment": "off",
		},
	},
	prettier,
];
