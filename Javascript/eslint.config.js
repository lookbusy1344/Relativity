import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import globals from "globals";

export default [
	eslint.configs.recommended,
	{
		files: ["src/**/*.ts", "src/**/*.tsx"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 2024,
				sourceType: "module",
				project: "./tsconfig.json",
			},
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		plugins: {
			"@typescript-eslint": tseslint,
		},
		rules: {
			...tseslint.configs["recommended"].rules,
			...tseslint.configs["recommended-requiring-type-checking"].rules,
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
		},
	},
	{
		files: ["**/*.js"],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
	{
		ignores: ["dist/**", "node_modules/**", "*.config.js", "*.config.ts"],
	},
];
