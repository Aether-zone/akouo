import type { Meta, StoryObj } from "@storybook/react";

import { Prose } from "../src";

const meta = {
  title: "Data/Prose",
  component: Prose,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Prose>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Prose className="w-96">
      <h2>Meeting notes</h2>
      <p>
        Akouo transcribes and <a href="#">diarizes</a> your recordings so you can
        focus on the conversation.
      </p>
      <ul>
        <li>Automatic speaker labels</li>
        <li>Time-coded transcript</li>
      </ul>
      <blockquote>The sound of listening.</blockquote>
      <p>
        Inline <code>code</code> stays legible in both themes.
      </p>
    </Prose>
  ),
};
