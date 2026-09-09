import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { DiarizationTimeline, SpeakerLegend } from "../src";
import type { DiarizationSegment } from "../src";

const segments: DiarizationSegment[] = [
  { speaker: 1, start: 0, end: 40, name: "Ada" },
  { speaker: 2, start: 40, end: 95, name: "Alan" },
  { speaker: 1, start: 95, end: 120, name: "Ada" },
  { speaker: 3, start: 120, end: 180, name: "Grace" },
  { speaker: 2, start: 180, end: 210, name: "Alan" },
  { speaker: 4, start: 210, end: 240, name: "Edsger" },
];

const meta = {
  title: "Akouo/DiarizationTimeline",
  component: DiarizationTimeline,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { segments, duration: 240 },
} satisfies Meta<typeof DiarizationTimeline>;

export default meta;

type Story = StoryObj<typeof meta>;

function Demo() {
  const [time, setTime] = useState(120);
  return (
    <div className="w-[32rem] space-y-3">
      <DiarizationTimeline
        segments={segments}
        duration={240}
        currentTime={time}
        onSeek={setTime}
      />
      <SpeakerLegend
        speakers={[
          { speaker: 1, name: "Ada" },
          { speaker: 2, name: "Alan" },
          { speaker: 3, name: "Grace" },
          { speaker: 4, name: "Edsger" },
        ]}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <Demo />,
};
