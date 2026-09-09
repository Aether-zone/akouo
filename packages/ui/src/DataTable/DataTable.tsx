import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  Checkbox,
  type CheckboxProps,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@aether-zone/kosmos";
import { cn } from "../lib/cn";
import { ChevronDownIcon } from "../lib/icons";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  /** Value used for sorting when `sortable`. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  emptyMessage?: ReactNode;
  className?: string;
}

type SortState = { columnId: string; direction: "asc" | "desc" } | null;

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

/** Sortable, selectable table with a typed column API. */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  selectable,
  onSelectionChange,
  emptyMessage = "No data",
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.id === sort.columnId);
    if (!col?.sortValue) return data;
    const sortValue = col.sortValue;
    return [...data].sort((a, b) => {
      const av = sortValue(a);
      const bv = sortValue(b);
      if (av < bv) return sort.direction === "asc" ? -1 : 1;
      if (av > bv) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sort, columns]);

  function toggleSort(col: DataTableColumn<T>) {
    if (!col.sortable || !col.sortValue) return;
    setSort((prev) => {
      if (prev?.columnId !== col.id) return { columnId: col.id, direction: "asc" };
      if (prev.direction === "asc") return { columnId: col.id, direction: "desc" };
      return null;
    });
  }

  function commitSelection(next: Set<string>) {
    setSelected(next);
    onSelectionChange?.([...next]);
  }

  const allIds = sorted.map(getRowId);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = allIds.some((id) => selected.has(id));

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {selectable && (
            <TableHead className="w-10">
              <Checkbox
                aria-label="Select all rows"
                checked={allSelected}
                {...indeterminateRef(!allSelected && someSelected)}
                onChange={() =>
                  commitSelection(allSelected ? new Set() : new Set(allIds))
                }
              />
            </TableHead>
          )}
          {columns.map((col) => (
            <TableHead
              key={col.id}
              className={cn(col.align && alignClass[col.align], col.className)}
              aria-sort={
                sort?.columnId === col.id
                  ? sort.direction === "asc"
                    ? "ascending"
                    : "descending"
                  : undefined
              }
            >
              {col.sortable ? (
                <button
                  type="button"
                  onClick={() => toggleSort(col)}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  {col.header}
                  <ChevronDownIcon
                    className={cn(
                      "size-3 transition-transform",
                      sort?.columnId === col.id ? "opacity-100" : "opacity-30",
                      sort?.columnId === col.id &&
                        sort.direction === "asc" &&
                        "rotate-180",
                    )}
                  />
                </button>
              ) : (
                col.header
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length + (selectable ? 1 : 0)}
              className="py-8 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          sorted.map((row) => {
            const id = getRowId(row);
            const isSelected = selected.has(id);
            return (
              <TableRow key={id} data-selected={isSelected || undefined}>
                {selectable && (
                  <TableCell>
                    <Checkbox
                      aria-label="Select row"
                      checked={isSelected}
                      onChange={() => {
                        const next = new Set(selected);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        commitSelection(next);
                      }}
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={cn(
                      col.align && alignClass[col.align],
                      col.className,
                    )}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

/**
 * `indeterminate` is DOM state with no HTML attribute, so it can only be set on
 * the node. kosmos's `CheckboxProps` does not name `ref` — but its Checkbox
 * spreads the rest of its props onto the `<input>`, and React 19 passes `ref`
 * through as an ordinary prop, so it reaches the element. The cast is what
 * bridges the typing gap; if kosmos ever stops spreading, this stops working
 * silently, which is why it is written once here and explained.
 */
function indeterminateRef(indeterminate: boolean): CheckboxProps {
  const props = {
    ref: (el: HTMLInputElement | null) => {
      if (el) el.indeterminate = indeterminate;
    },
  };

  return props as unknown as CheckboxProps;
}
