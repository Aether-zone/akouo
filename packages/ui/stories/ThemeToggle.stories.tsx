import type { Meta, StoryObj } from "@storybook/react";

import { ThemeProvider, ThemeToggle } from "../src";

const meta = {
  title: "Theming/ThemeToggle",
  component: ThemeToggle,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ThemeProvider>
      <ThemeToggle variant="outline" />
    </ThemeProvider>
  ),
};
