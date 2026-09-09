import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import { Checkbox } from "@aether-zone/kosmos";
import { cn } from "../lib/cn";

interface CheckboxGroupContextValue {
  value: string[];
  toggle: (value: string) => void;
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(
  null,
);

export interface CheckboxGroupProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}

/** Multi-select group of checkboxes. Controlled via `value` (array). */
export function CheckboxGroup({
  value,
  onValueChange,
  className,
  children,
  "aria-label": ariaLabel,
}: CheckboxGroupProps) {
  function toggle(item: string) {
    if (value.includes(item)) onValueChange(value.filter((v) => v !== item));
    else onValueChange([...value, item]);
  }
  return (
    <CheckboxGroupContext.Provider value={{ value, toggle }}>
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn("flex flex-col gap-2", className)}
      >
        {children}
      </div>
    </CheckboxGroupContext.Provider>
  );
}

export interface CheckboxGroupItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export function CheckboxGroupItem({
  value,
  disabled,
  className,
  children,
}: CheckboxGroupItemProps) {
  const ctx = useContext(CheckboxGroupContext);
  if (!ctx)
    throw new Error("CheckboxGroupItem must be used within <CheckboxGroup>");
  return (
    <label
      className={cn(
        "flex items-center gap-2 text-sm text-foreground",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <Checkbox
        value={value}
        checked={ctx.value.includes(value)}
        onChange={() => ctx.toggle(value)}
        disabled={disabled}
      />
      {children}
    </label>
  );
}
