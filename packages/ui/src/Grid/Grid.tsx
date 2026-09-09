import type { CSSProperties, ComponentPropsWithRef } from "react";

import { cn } from "../lib/cn";

export interface GridProps extends ComponentPropsWithRef<"div"> {
  /** Number of equal columns. */
  cols?: number;
  /** Gap in Tailwind spacing units (1 = 0.25rem). */
  gap?: number;
}

/** Simple equal-column CSS grid. */
export function Grid({
  cols = 1,
  gap = 4,
  className,
  style,
  ...props
}: GridProps) {
  const merged: CSSProperties = {
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: `${gap * 0.25}rem`,
    ...style,
  };
  return <div className={cn("grid", className)} style={merged} {...props} />;
}
