import type { ComponentPropsWithRef } from "react";

import { cn } from "../lib/cn";

export interface ContainerProps extends ComponentPropsWithRef<"div"> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizes: Record<NonNullable<ContainerProps["size"]>, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

/** Centered, padded page container with a max width. */
export function Container({ className, size = "lg", ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
