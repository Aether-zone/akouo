import type { CSSProperties, ComponentPropsWithRef } from "react";

import { cn } from "../lib/cn";

export interface StackProps extends ComponentPropsWithRef<"div"> {
  direction?: "row" | "column";
  /** Gap in Tailwind spacing units (1 = 0.25rem). */
  gap?: number;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around";
  wrap?: boolean;
}

const alignClass: Record<NonNullable<StackProps["align"]>, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyClass: Record<NonNullable<StackProps["justify"]>, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

/** Flexbox stack — vertical by default. Composes Flex + gap. */
export function Stack({
  direction = "column",
  gap = 0,
  align,
  justify,
  wrap,
  className,
  style,
  ...props
}: StackProps) {
  const merged: CSSProperties = { gap: `${gap * 0.25}rem`, ...style };
  return (
    <div
      className={cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        wrap && "flex-wrap",
        align && alignClass[align],
        justify && justifyClass[justify],
        className,
      )}
      style={merged}
      {...props}
    />
  );
}
