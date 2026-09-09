import type { Meta, StoryObj } from "@storybook/react";

import { Grid } from "../src";

const meta = {
  title: "Layout/Grid",
  component: Grid,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Grid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ThreeColumns: Story = {
  render: () => (
    <Grid cols={3} gap={3} className="w-96">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="rounded-md bg-secondary px-4 py-6 text-center text-sm text-secondary-foreground"
        >
          {i + 1}
        </div>
      ))}
    </Grid>
  ),
};
