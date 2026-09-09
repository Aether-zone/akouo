import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { SpeakerPicker } from "../src";
import type { Speaker } from "../src";

const meta = {
  title: "Akouo/SpeakerPicker",
  component: SpeakerPicker,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { value: 1, onChange: () => {} },
} satisfies Meta<typeof SpeakerPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

function PickerDemo() {
  const [value, setValue] = useState<Speaker>(1);
  return (
    <SpeakerPicker
      value={value}
      onChange={setValue}
      names={{ 1: "Ada", 2: "Alan", 3: "Grace" }}
    />
  );
}

export const Default: Story = {
  render: () => <PickerDemo />,
};
