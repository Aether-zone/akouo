import base from "../eslint.base.js";

/**
 * The Nest side, on the same base as everything else.
 *
 * `.mjs` because this package is CommonJS — it has no `"type": "module"`, which
 * is what lets `webpack.config.js` keep using `require` — so the extension is
 * what marks this one file as ESM.
 *
 * Replaces the config the NestJS scaffold shipped, which pulled in
 * `eslint-plugin-prettier` and type-aware linting via `projectService` —
 * neither of which this repo installs any more.
 */
export default [
  ...base,
  { ignores: ["dist/**", "uploads/**", "docker/**"] },
  {
    // The build script is CommonJS — this package has no `"type": "module"` —
    // so `require` is the correct call there, not a lapse.
    files: ["webpack.config.js"],
    languageOptions: { sourceType: "commonjs" },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];
