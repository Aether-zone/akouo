import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "@aether-zone/kosmos";
import { DataTable } from "../src";
import type { DataTableColumn } from "../src";

interface Session {
  id: string;
  name: string;
  minutes: number;
  speakers: number;
  status: "ready" | "processing";
}

const rows: Session[] = [
  { id: "1", name: "Weekly sync", minutes: 42, speakers: 4, status: "ready" },
  { id: "2", name: "Design review", minutes: 58, speakers: 3, status: "ready" },
  { id: "3", name: "1:1 with Ada", minutes: 25, speakers: 2, status: "processing" },
  { id: "4", name: "All hands", minutes: 63, speakers: 6, status: "ready" },
];

const columns: DataTableColumn<Session>[] = [
  { id: "name", header: "Session", cell: (r) => r.name, sortable: true, sortValue: (r) => r.name },
  {
    id: "minutes",
    header: "Minutes",
    align: "right",
    cell: (r) => <span className="tabular-nums">{r.minutes}</span>,
    sortable: true,
    sortValue: (r) => r.minutes,
  },
  {
    id: "speakers",
    header: "Speakers",
    align: "right",
    cell: (r) => <span className="tabular-nums">{r.speakers}</span>,
    sortable: true,
    sortValue: (r) => r.speakers,
  },
  {
    id: "status",
    header: "Status",
    cell: (r) => (
      <Badge variant={r.status === "ready" ? "success" : "secondary"}>
        {r.status}
      </Badge>
    ),
  },
];

const meta = {
  title: "Layout/DataTable",
  component: DataTable,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { columns: [], data: [], getRowId: () => "" },
} satisfies Meta<typeof DataTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Selectable: Story = {
  render: () => (
    <div className="w-[32rem]">
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        selectable
      />
    </div>
  ),
};
