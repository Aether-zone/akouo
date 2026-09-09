import type { Config } from "tailwindcss";
import preset from "@akouo/theme/preset";

/**
 * Web app Tailwind config — extends the shared Akouo preset so every token
 * comes from `@akouo/theme`. Changing a token there re-skins this app.
 */
export default {
  presets: [preset],
} satisfies Config;
