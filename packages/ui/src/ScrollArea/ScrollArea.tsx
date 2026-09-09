import type { ComponentPropsWithRef } from "react";

import { cn } from "../lib/cn";

export type ScrollAreaProps = ComponentPropsWithRef<"div">;

/**
 * Scroll container with a slim, themed scrollbar. Constrain it with a height
 * or max-height utility (e.g. `className="max-h-72"`).
 */
export function ScrollArea({ className, ...props }: ScrollAreaProps) {
  return (
    <div
      className={cn(
        "overflow-auto",
        "[scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]",
        "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2",
        "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}
