import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Consume the workspace packages as TypeScript source (no prebuild step).
  transpilePackages: ["@akouo/ui", "@akouo/theme"],
  turbopack: {
    /*
     * The monorepo root, stated rather than inferred.
     *
     * Next infers the root from the nearest lockfile, but stops at a Git
     * repository boundary — and `web/` is still a Git repository of its own, so
     * inference clamps to `web/` and never sees the workspace's `node_modules`
     * or the `packages/*` this app transpiles. Point it at the real root and
     * both come back into scope. Remove this only if `web/.git` goes away.
     */
    root: path.join(here, ".."),
  },
};

export default nextConfig;
