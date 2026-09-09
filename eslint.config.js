import base from "./eslint.base.js";

/**
 * Root config, for files that belong to no project — this file, the shared
 * config, and anything else at the top level. Each project ships its own
 * `eslint.config.js`; `pnpm lint` runs them all.
 */
export default [
  ...base,
  { ignores: ["**/dist/**", "**/out-tsc/**", "**/.next/**", "**/test-output/**"] },
];
