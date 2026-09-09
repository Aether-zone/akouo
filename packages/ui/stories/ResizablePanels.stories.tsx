import type { Meta, StoryObj } from "@storybook/react";

import { ResizablePanels } from "../src";

const meta = {
  title: "Layout/ResizablePanels",
  component: ResizablePanels,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { first: null, second: null },
} satisfies Meta<typeof ResizablePanels>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <ResizablePanels
      className="h-64 w-[32rem] overflow-hidden rounded-lg border border-border"
      defaultSize={35}
      first={
        <div className="h-full bg-card p-4 text-sm text-muted-foreground">
          Sidebar
        </div>
      }
      second={
        <div className="h-full p-4 text-sm text-foreground">
          Drag the divider to resize. Use arrow keys when the divider is
          focused.
        </div>
      }
    />
  ),
};
