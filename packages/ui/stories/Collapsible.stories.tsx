import type { Meta, StoryObj } from "@storybook/react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../src";

const meta = {
  title: "Layout/Collapsible",
  component: Collapsible,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: null },
} satisfies Meta<typeof Collapsible>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-72">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
        Advanced options
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 py-2 text-sm text-muted-foreground">
        Extra settings live here, hidden until needed.
      </CollapsibleContent>
    </Collapsible>
  ),
};
