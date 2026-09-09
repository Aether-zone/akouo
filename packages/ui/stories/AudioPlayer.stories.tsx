import type { Meta, StoryObj } from "@storybook/react";

import { AudioPlayer } from "../src";

// 44-byte silent WAV (no samples) — renders the player without a network call.
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

const meta = {
  title: "Akouo/AudioPlayer",
  component: AudioPlayer,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { src: SILENT_WAV },
} satisfies Meta<typeof AudioPlayer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[28rem]">
      <AudioPlayer src={SILENT_WAV} />
    </div>
  ),
};
