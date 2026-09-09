import type { ComponentPropsWithRef } from "react";

import { cn } from "../lib/cn";

export type ButtonGroupProps = ComponentPropsWithRef<"div">;

/**
 * Joins a row of Buttons/IconButtons into a single segmented control — flush
 * borders, shared radii only on the outer edges.
 */
export function ButtonGroup({ className, ...props }: ButtonGroupProps) {
  return (
    <div
      role="group"
      className={cn(
        "inline-flex [&>*]:rounded-none [&>*:not(:first-child)]:-ml-px [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md focus-within:[&>*:focus-visible]:z-10 [&>*:focus-visible]:relative",
        className,
      )}
      {...props}
    />
  );
}
