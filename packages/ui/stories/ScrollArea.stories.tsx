import type { Meta, StoryObj } from "@storybook/react";

import { ScrollArea } from "../src";

const meta = {
  title: "Layout/ScrollArea",
  component: ScrollArea,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-48 w-64 rounded-md border border-border p-3">
      <ul className="space-y-2 text-sm text-foreground">
        {Array.from({ length: 20 }, (_, i) => (
          <li key={i} className="rounded bg-muted px-3 py-2">
            Segment {i + 1}
          </li>
        ))}
      </ul>
    </ScrollArea>
  ),
};
