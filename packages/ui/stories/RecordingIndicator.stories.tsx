import type { Meta, StoryObj } from "@storybook/react";

import { RecordingIndicator } from "../src";

const meta = {
  title: "UI/RecordingIndicator",
  component: RecordingIndicator,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof RecordingIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DotOnly: Story = {
  args: { label: null },
};
