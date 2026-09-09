import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { TimePicker } from "../src";

const meta = {
  title: "UI/TimePicker",
  component: TimePicker,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { value: "", onChange: () => {} },
} satisfies Meta<typeof TimePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

function TimePickerDemo({ initial }: { initial: string }) {
  const [time, setTime] = useState(initial);
  return <TimePicker value={time} onChange={setTime} />;
}

export const Default: Story = {
  render: () => <TimePickerDemo initial="" />,
};

export const WithValue: Story = {
  render: () => <TimePickerDemo initial="09:30" />,
};
