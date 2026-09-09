import type { ComponentPropsWithRef } from "react";

import { cn } from "../lib/cn";

/*
 * ToggleGroup / ToggleGroupItem now come from `@aether-zone/kosmos`. Only the
 * standalone pressed-state button lives here, because Kosmos has no equivalent.
 */

const toggleBase =
  "inline-flex items-center justify-center gap-2 rounded-md px-3 h-9 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground";

export interface ToggleButtonProps
  extends Omit<ComponentPropsWithRef<"button">, "onChange"> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
}

/** Standalone two-state toggle button (`aria-pressed`). */
export function ToggleButton({
  pressed = false,
  onPressedChange,
  className,
  type = "button",
  ...props
}: ToggleButtonProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      data-state={pressed ? "on" : "off"}
      onClick={() => onPressedChange?.(!pressed)}
      className={cn(toggleBase, className)}
      {...props}
    />
  );
}
