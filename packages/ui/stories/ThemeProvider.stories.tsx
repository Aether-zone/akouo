import type { Meta, StoryObj } from "@storybook/react";

import { Badge, Card, CardContent } from "@aether-zone/kosmos";
import { ThemeProvider, ThemeToggle, useTheme } from "../src";

const meta = {
  title: "Theming/ThemeProvider",
  component: ThemeProvider,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: null },
} satisfies Meta<typeof ThemeProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

function Panel() {
  const { theme, resolvedTheme } = useTheme();
  return (
    <Card className="w-80">
      <CardContent className="flex items-center gap-3 p-6">
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">Appearance</div>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{theme}</Badge>
            <span>resolved: {resolvedTheme}</span>
          </div>
        </div>
        <ThemeToggle variant="outline" />
      </CardContent>
    </Card>
  );
}

export const Default: Story = {
  render: () => (
    <ThemeProvider>
      <Panel />
    </ThemeProvider>
  ),
};
