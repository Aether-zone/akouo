import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import base from "./eslint.base.js";

/**
 * React flat config: the base plus React and react-hooks rules.
 * Used by the apps and `@akouo/ui`.
 */
export default [
  ...base,
  {
    files: ["**/*.{jsx,tsx}"],
    ...react.configs.flat.recommended,
    settings: { react: { version: "detect" } },
  },
  {
    files: ["**/*.{jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // New JSX transform: React need not be in scope.
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
    },
  },
];
