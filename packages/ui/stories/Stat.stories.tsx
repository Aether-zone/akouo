import type { Meta, StoryObj } from "@storybook/react";

import { Stat } from "../src";

const meta = {
  title: "Data/Stat",
  component: Stat,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { label: "Sessions", value: "128" },
} satisfies Meta<typeof Stat>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: {
    label: "Minutes transcribed",
    value: "4,210",
    delta: "12%",
    trend: "up",
    hint: "vs. last week",
  },
};

export const Row: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-3">
      <Stat label="Sessions" value="128" delta="8%" trend="up" />
      <Stat label="Avg. length" value="37m" delta="3%" trend="down" />
      <Stat label="Speakers" value="342" trend="neutral" hint="all time" />
    </div>
  ),
};
