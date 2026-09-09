import type { Meta, StoryObj } from "@storybook/react";

import { Link } from "@aether-zone/kosmos";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../src";

const meta = {
  title: "UI/HoverCard",
  component: HoverCard,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: null },
} satisfies Meta<typeof HoverCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger>
        <Link href="#">@ada</Link>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Ada Lovelace</p>
          <p className="text-sm text-muted-foreground">
            Speaker 1 · 18 min of talk time across this session.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};
