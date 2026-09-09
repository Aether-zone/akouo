import type { Meta, StoryObj } from "@storybook/react";

import { LiveCaption } from "../src";

const meta = {
  title: "Akouo/LiveCaption",
  component: LiveCaption,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof LiveCaption>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Streaming: Story = {
  render: () => (
    <div className="w-96">
      <LiveCaption
        finalText="So the plan for next quarter is to ship diarization"
        partialText="and improve the live caption latency"
      />
    </div>
  ),
};

export const FinalOnly: Story = {
  render: () => (
    <div className="w-96">
      <LiveCaption active={false} finalText="Recording ended. Transcript saved." />
    </div>
  ),
};
