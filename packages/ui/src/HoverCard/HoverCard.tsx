import { createContext, useContext, useRef, useState } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";

import { cn } from "../lib/cn";

interface HoverCardContextValue {
  open: boolean;
  show: () => void;
  hide: () => void;
}

const HoverCardContext = createContext<HoverCardContextValue | null>(null);

function useHoverCard(component: string): HoverCardContextValue {
  const ctx = useContext(HoverCardContext);
  if (!ctx) throw new Error(`${component} must be used within <HoverCard>`);
  return ctx;
}

/** Rich hover/focus preview card. Opens on pointer or keyboard focus. */
export function HoverCard({
  children,
  openDelay = 200,
  closeDelay = 150,
}: {
  children: ReactNode;
  openDelay?: number;
  closeDelay?: number;
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clear() {
    if (timer.current) clearTimeout(timer.current);
  }
  function show() {
    clear();
    timer.current = setTimeout(() => setOpen(true), openDelay);
  }
  function hide() {
    clear();
    timer.current = setTimeout(() => setOpen(false), closeDelay);
  }

  return (
    <HoverCardContext.Provider value={{ open, show, hide }}>
      <span className="relative inline-flex">{children}</span>
    </HoverCardContext.Provider>
  );
}

export function HoverCardTrigger({
  className,
  ...props
}: ComponentPropsWithRef<"span">) {
  const { show, hide } = useHoverCard("HoverCardTrigger");
  return (
    <span
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className={cn("inline-flex", className)}
      {...props}
    />
  );
}

export function HoverCardContent({
  className,
  children,
  align = "start",
}: {
  className?: string;
  children: ReactNode;
  align?: "start" | "end" | "center";
}) {
  const { open, show, hide } = useHoverCard("HoverCardContent");
  if (!open) return null;

  const alignClass =
    align === "end"
      ? "right-0"
      : align === "center"
        ? "left-1/2 -translate-x-1/2"
        : "left-0";

  return (
    <div
      role="dialog"
      onMouseEnter={show}
      onMouseLeave={hide}
      className={cn(
        "absolute top-full z-50 mt-1.5 w-64 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md",
        alignClass,
        className,
      )}
    >
      {children}
    </div>
  );
}
