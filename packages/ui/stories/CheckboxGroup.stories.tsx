import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { CheckboxGroup, CheckboxGroupItem } from "../src";

const meta = {
  title: "Forms/CheckboxGroup",
  component: CheckboxGroup,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { value: [], onValueChange: () => {}, children: null },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

function Demo() {
  const [value, setValue] = useState<string[]>(["timecodes"]);
  return (
    <CheckboxGroup
      value={value}
      onValueChange={setValue}
      aria-label="Export options"
    >
      <CheckboxGroupItem value="timecodes">Include timecodes</CheckboxGroupItem>
      <CheckboxGroupItem value="speakers">Speaker labels</CheckboxGroupItem>
      <CheckboxGroupItem value="summary">AI summary</CheckboxGroupItem>
    </CheckboxGroup>
  );
}

export const Default: Story = {
  render: () => <Demo />,
};
