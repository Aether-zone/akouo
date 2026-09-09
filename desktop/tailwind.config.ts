import type { Config } from "tailwindcss";
import preset from "@akouo/theme/preset";

/**
 * Desktop renderer Tailwind config — extends the shared Akouo preset so every
 * token comes from `@akouo/theme`. Changing a token there re-skins this app.
 *
 * `src/renderer/src/index.css` has always pointed `@config` here; the file was
 * simply missing, which broke the build the moment anything tried to run it.
 */
export default {
  presets: [preset],
} satisfies Config;
