import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { cn } from "../lib/cn";
import { ChevronLeftIcon, ChevronRightIcon } from "../lib/icons";

export interface CalendarProps {
  value?: Date | null;
  onSelect: (date: Date) => void;
  defaultMonth?: Date;
  className?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function isoKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Month-grid date picker with roving-tabindex keyboard navigation. */
export function Calendar({
  value,
  onSelect,
  defaultMonth,
  className,
}: CalendarProps) {
  const today = new Date();
  const initial = value ?? defaultMonth ?? today;
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(initial));
  const [focusedDate, setFocusedDate] = useState(value ?? initial);
  const dayRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // 6 weeks × 7 days starting on the Sunday on/before the 1st.
  const gridStart = addDays(visibleMonth, -visibleMonth.getDay());
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);

  function moveFocus(next: Date) {
    setFocusedDate(next);
    if (next.getMonth() !== visibleMonth.getMonth()) {
      setVisibleMonth(startOfMonth(next));
    }
    requestAnimationFrame(() => dayRefs.current.get(isoKey(next))?.focus());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const map: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const delta = map[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      moveFocus(addDays(focusedDate, delta));
    } else if (event.key === "Home") {
      event.preventDefault();
      moveFocus(addDays(focusedDate, -focusedDate.getDay()));
    } else if (event.key === "End") {
      event.preventDefault();
      moveFocus(addDays(focusedDate, 6 - focusedDate.getDay()));
    } else if (event.key === "PageUp") {
      event.preventDefault();
      moveFocus(addMonths(focusedDate, -1));
    } else if (event.key === "PageDown") {
      event.preventDefault();
      moveFocus(addMonths(focusedDate, 1));
    }
  }

  return (
    <div className={cn("w-64 select-none p-3", className)}>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeftIcon />
        </button>
        <div aria-live="polite" className="text-sm font-medium text-foreground">
          {monthLabel}
        </div>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div
        className="grid grid-cols-7 gap-0.5"
        role="grid"
        aria-label={monthLabel}
        onKeyDown={handleKeyDown}
      >
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            role="columnheader"
            className="py-1 text-center text-xs font-medium text-muted-foreground"
          >
            {wd}
          </div>
        ))}
        {days.map((day) => {
          const outside = day.getMonth() !== visibleMonth.getMonth();
          const selected = value ? isSameDay(day, value) : false;
          const isToday = isSameDay(day, today);
          const focusable = isSameDay(day, focusedDate);
          return (
            <button
              key={isoKey(day)}
              ref={(el) => {
                if (el) dayRefs.current.set(isoKey(day), el);
                else dayRefs.current.delete(isoKey(day));
              }}
              type="button"
              role="gridcell"
              aria-selected={selected}
              tabIndex={focusable ? 0 : -1}
              onClick={() => {
                setFocusedDate(day);
                onSelect(day);
              }}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                outside && "text-muted-foreground/50",
                !selected && "hover:bg-accent hover:text-accent-foreground",
                selected && "bg-primary text-primary-foreground",
                isToday && !selected && "border border-border",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
