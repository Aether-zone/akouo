import type { Meta, StoryObj } from "@storybook/react";

import { Timecode } from "../src";

const meta = {
  title: "Akouo/Timecode",
  component: Timecode,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { seconds: 92 },
} satisfies Meta<typeof Timecode>;

export default meta;

type Story = StoryObj<typeof meta>;

export const UnderAnHour: Story = { args: { seconds: 92 } };
export const OverAnHour: Story = { args: { seconds: 3725 } };
export const ForcedHours: Story = { args: { seconds: 42, forceHours: true } };
