import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { TranscriptView } from "../src";
import type { TranscriptSegment } from "../src";

const segments: TranscriptSegment[] = [
  { id: "1", speaker: 1, name: "Ada", start: 0, text: "Shall we start with the roadmap?" },
  { id: "2", speaker: 2, name: "Alan", start: 6, text: "Yes — I'll share the Q3 milestones." },
  { id: "3", speaker: 1, name: "Ada", start: 14, text: "Great. Let's cover diarization first." },
  { id: "4", speaker: 3, name: "Grace", start: 22, text: "The new palette makes speakers much easier to follow." },
];

const meta = {
  title: "Akouo/TranscriptView",
  component: TranscriptView,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { segments },
} satisfies Meta<typeof TranscriptView>;

export default meta;

type Story = StoryObj<typeof meta>;

function TranscriptDemo() {
  const [time, setTime] = useState(14);
  return (
    <div className="w-96">
      <TranscriptView segments={segments} currentTime={time} onSeek={setTime} />
    </div>
  );
}

export const Default: Story = {
  render: () => <TranscriptDemo />,
};
