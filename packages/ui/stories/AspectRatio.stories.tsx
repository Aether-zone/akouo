import type { Meta, StoryObj } from "@storybook/react";

import { AspectRatio } from "../src";

const meta = {
  title: "Layout/AspectRatio",
  component: AspectRatio,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof AspectRatio>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Widescreen: Story = {
  render: () => (
    <div className="w-80">
      <AspectRatio ratio={16 / 9} className="rounded-lg bg-muted">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          16 / 9
        </div>
      </AspectRatio>
    </div>
  ),
};
