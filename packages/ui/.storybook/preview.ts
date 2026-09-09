import type { Preview } from "@storybook/react";

import "./tailwind.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
  globalTypes: {
    theme: {
      description: "Akouo color theme",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle(
          "dark",
          context.globals.theme === "dark",
        );
      }
      return Story();
    },
  ],
};

export default preview;
