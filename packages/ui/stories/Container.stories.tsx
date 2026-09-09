import type { Meta, StoryObj } from "@storybook/react";

import { Container } from "../src";

const meta = {
  title: "Layout/Container",
  component: Container,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof Container>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Container size="md" className="py-8">
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Centered, padded, max-width content.
      </div>
    </Container>
  ),
};
