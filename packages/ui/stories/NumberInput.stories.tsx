import type { Meta, StoryObj } from "@storybook/react";

import { NumberInput } from "../src";

const meta: Meta<typeof NumberInput> = {
  title: "UI/NumberInput",
  component: NumberInput,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "0", min: 0, max: 100, step: 1 },
};

export const WithValue: Story = {
  args: { defaultValue: 42, min: 0, max: 100 },
};
