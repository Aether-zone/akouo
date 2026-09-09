import type { Meta, StoryObj } from "@storybook/react";

import { SpeakerLegend } from "../src";

const meta = {
  title: "Akouo/SpeakerLegend",
  component: SpeakerLegend,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { speakers: [] },
} satisfies Meta<typeof SpeakerLegend>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    speakers: [
      { speaker: 1, name: "Ada Lovelace", meta: "18:24" },
      { speaker: 2, name: "Alan Turing", meta: "12:07" },
      { speaker: 3, name: "Grace Hopper", meta: "09:51" },
      { speaker: 4, meta: "02:15" },
    ],
  },
};
