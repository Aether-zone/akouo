import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { TagInput } from "../src";

const meta = {
  title: "UI/TagInput",
  component: TagInput,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { value: [], onChange: () => {} },
} satisfies Meta<typeof TagInput>;

export default meta;

type Story = StoryObj<typeof meta>;

function TagInputDemo({ initial }: { initial: string[] }) {
  const [tags, setTags] = useState(initial);
  return (
    <div className="w-72">
      <TagInput value={tags} onChange={setTags} placeholder="Add a tag…" />
    </div>
  );
}

export const Default: Story = {
  render: () => <TagInputDemo initial={[]} />,
};

export const WithTags: Story = {
  render: () => <TagInputDemo initial={["meeting", "q3", "product"]} />,
};
