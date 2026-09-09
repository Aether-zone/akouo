import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx|mdx)"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      // Process the Akouo theme layer (Tailwind v4) for the Storybook canvas.
      plugins: [tailwindcss()],
    }),
};

export default config;
