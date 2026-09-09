import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

/**
 * Base flat config: JS + TypeScript, no framework rules.
 *
 * Used directly by `@akouo/theme` and the repo root, and composed into
 * `eslint.react.js`. A plain file at the repo root rather than a workspace
 * package — its plugins are declared in the root `package.json`, so every
 * project resolves them from here and none has to install the set itself.
 */
export default [
  {
    ignores: [
      "**/dist/**",
      "**/out/**",
      "**/build/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/*.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // TypeScript's own checker handles undefined references; the core rule
    // produces false positives on types and globals.
    files: ["**/*.{ts,tsx,mts,cts}"],
    rules: {
      // TypeScript's own checker handles undefined references; the core rule
      // produces false positives on types and globals.
      "no-undef": "off",
      // A leading underscore marks something deliberately unused — a parameter
      // required by an interface, a destructured field being skipped.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];
