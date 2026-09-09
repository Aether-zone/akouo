import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { TransportControls } from "../src";

const meta = {
  title: "Akouo/TransportControls",
  component: TransportControls,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { playing: false, onPlayPause: () => {} },
} satisfies Meta<typeof TransportControls>;

export default meta;

type Story = StoryObj<typeof meta>;

function TransportDemo() {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  return (
    <TransportControls
      playing={playing}
      onPlayPause={() => setPlaying((p) => !p)}
      onSkip={() => {}}
      speed={speed}
      onSpeedChange={setSpeed}
    />
  );
}

export const Default: Story = {
  render: () => <TransportDemo />,
};
