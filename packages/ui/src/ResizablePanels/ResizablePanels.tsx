import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";

import { cn } from "../lib/cn";

export interface ResizablePanelsProps {
  first: ReactNode;
  second: ReactNode;
  direction?: "horizontal" | "vertical";
  /** Initial size of the first panel, in percent (0–100). */
  defaultSize?: number;
  /** Minimum size of either panel, in percent. */
  minSize?: number;
  className?: string;
}

/** Two-pane splitter with a draggable, keyboard-adjustable divider. */
export function ResizablePanels({
  first,
  second,
  direction = "horizontal",
  defaultSize = 50,
  minSize = 15,
  className,
}: ResizablePanelsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [size, setSize] = useState(defaultSize);
  const horizontal = direction === "horizontal";

  const clamp = (v: number) => Math.min(100 - minSize, Math.max(minSize, v));

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = horizontal
      ? (event.clientX - rect.left) / rect.width
      : (event.clientY - rect.top) / rect.height;
    setSize(clamp(ratio * 100));
  }
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    dragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  const panelStyle = (basis: number): CSSProperties => ({
    flexBasis: `${basis}%`,
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 0,
    minHeight: 0,
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex",
        horizontal ? "flex-row" : "flex-col",
        dragging.current && "select-none",
        className,
      )}
    >
      <div style={panelStyle(size)} className="overflow-auto">
        {first}
      </div>
      <div
        role="separator"
        aria-orientation={horizontal ? "vertical" : "horizontal"}
        aria-valuenow={Math.round(size)}
        aria-valuemin={minSize}
        aria-valuemax={100 - minSize}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={(e) => {
          const step = 2;
          if (horizontal && e.key === "ArrowLeft") setSize((s) => clamp(s - step));
          else if (horizontal && e.key === "ArrowRight")
            setSize((s) => clamp(s + step));
          else if (!horizontal && e.key === "ArrowUp")
            setSize((s) => clamp(s - step));
          else if (!horizontal && e.key === "ArrowDown")
            setSize((s) => clamp(s + step));
        }}
        className={cn(
          "shrink-0 bg-border transition-colors hover:bg-ring focus-visible:bg-ring focus-visible:outline-none",
          horizontal ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize",
        )}
      />
      <div style={panelStyle(100 - size)} className="overflow-auto">
        {second}
      </div>
    </div>
  );
}
