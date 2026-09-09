import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@aether-zone/kosmos";
import { ButtonGroup } from "../src";

const meta = {
  title: "UI/ButtonGroup",
  component: ButtonGroup,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ButtonGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="secondary">Day</Button>
      <Button variant="secondary">Week</Button>
      <Button variant="secondary">Month</Button>
    </ButtonGroup>
  ),
};
