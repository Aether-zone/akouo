import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { ToggleButton } from "../src";

const meta = {
  title: "UI/Toggle",
  component: ToggleButton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ToggleButton>;

export default meta;

type Story = StoryObj<typeof meta>;

function SingleToggle() {
  const [pressed, setPressed] = useState(false);
  return (
    <ToggleButton pressed={pressed} onPressedChange={setPressed}>
      Bold
    </ToggleButton>
  );
}

/* ToggleGroup is documented in Kosmos' own Storybook — see `@aether-zone/kosmos`. */
export const Button: Story = {
  render: () => <SingleToggle />,
};
