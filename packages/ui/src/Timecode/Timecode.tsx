import type { ComponentPropsWithRef } from "react";

import { cn } from "../lib/cn";

/** Format seconds as `M:SS` (or `H:MM:SS` past an hour, or when forced). */
export function formatTimecode(
  totalSeconds: number,
  opts?: { forceHours?: boolean },
): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0 || opts?.forceHours) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

export interface TimecodeProps
  extends Omit<ComponentPropsWithRef<"time">, "children"> {
  /** Time position in seconds. */
  seconds: number;
  forceHours?: boolean;
}

/** Monospaced, tabular-figure timecode — aligns cleanly in lists. */
export function Timecode({
  seconds,
  forceHours,
  className,
  ...props
}: TimecodeProps) {
  return (
    <time
      className={cn(
        "font-mono text-xs tabular-nums text-muted-foreground",
        className,
      )}
      {...props}
    >
      {formatTimecode(seconds, { forceHours })}
    </time>
  );
}
