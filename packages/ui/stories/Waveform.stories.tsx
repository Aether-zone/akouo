import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Waveform } from "../src";

const peaks = Array.from(
  { length: 64 },
  (_, i) => 0.2 + 0.7 * Math.abs(Math.sin(i / 2.5)),
);

const meta = {
  title: "Akouo/Waveform",
  component: Waveform,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { peaks },
} satisfies Meta<typeof Waveform>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Static: Story = {
  render: () => (
    <div className="w-96">
      <Waveform peaks={peaks} progress={0.4} />
    </div>
  ),
};

function SeekableWaveform() {
  const [progress, setProgress] = useState(0.4);
  return (
    <div className="w-96">
      <Waveform peaks={peaks} progress={progress} onSeek={setProgress} />
    </div>
  );
}

export const Seekable: Story = {
  render: () => <SeekableWaveform />,
};
