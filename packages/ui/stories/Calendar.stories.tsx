import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Calendar } from "../src";

const meta = {
  title: "UI/Calendar",
  component: Calendar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { onSelect: () => {} },
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

function CalendarDemo() {
  const [date, setDate] = useState<Date | null>(new Date());
  return (
    <div className="rounded-md border border-border bg-popover">
      <Calendar value={date} onSelect={setDate} />
    </div>
  );
}

export const Default: Story = {
  render: () => <CalendarDemo />,
};
