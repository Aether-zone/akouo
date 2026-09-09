import type { Meta, StoryObj } from "@storybook/react";

import { Stack } from "../src";

const meta = {
  title: "Layout/Stack",
  component: Stack,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Stack>;

export default meta;

type Story = StoryObj<typeof meta>;

const Box = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-md bg-secondary px-4 py-2 text-sm text-secondary-foreground">
    {children}
  </div>
);

export const Vertical: Story = {
  render: () => (
    <Stack gap={3}>
      <Box>One</Box>
      <Box>Two</Box>
      <Box>Three</Box>
    </Stack>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Stack direction="row" gap={3} align="center">
      <Box>One</Box>
      <Box>Two</Box>
      <Box>Three</Box>
    </Stack>
  ),
};
