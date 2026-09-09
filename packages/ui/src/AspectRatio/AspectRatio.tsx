import type { CSSProperties, ComponentPropsWithRef } from "react";

import { cn } from "../lib/cn";

export interface AspectRatioProps extends ComponentPropsWithRef<"div"> {
  /** Width / height, e.g. 16 / 9. Default 1. */
  ratio?: number;
}

/** Maintains a fixed width-to-height ratio for its content (media, embeds). */
export function AspectRatio({
  ratio = 1,
  className,
  style,
  ...props
}: AspectRatioProps) {
  const merged: CSSProperties = { aspectRatio: String(ratio), ...style };
  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={merged}
      {...props}
    />
  );
}
