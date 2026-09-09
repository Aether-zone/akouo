import type { Meta, StoryObj } from "@storybook/react";

import { SpeakerTag } from "../src";

const meta = {
  title: "Akouo/SpeakerTag",
  component: SpeakerTag,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { speaker: 1, name: "Ada" },
} satisfies Meta<typeof SpeakerTag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Named: Story = { args: { speaker: 2, name: "Alan Turing" } };
export const Unnamed: Story = { args: { speaker: 3 } };

export const Palette: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {([1, 2, 3, 4, 5, 6] as const).map((n) => (
        <SpeakerTag key={n} speaker={n} />
      ))}
    </div>
  ),
};
