import { createContext, useContext, useId, useState } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";

import { cn } from "../lib/cn";

interface CollapsibleContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsible(component: string): CollapsibleContextValue {
  const ctx = useContext(CollapsibleContext);
  if (!ctx) throw new Error(`${component} must be used within <Collapsible>`);
  return ctx;
}

export interface CollapsibleProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: ReactNode;
}

/** Single show/hide disclosure. Controlled via `open` or `defaultOpen`. */
export function Collapsible({
  open,
  defaultOpen,
  onOpenChange,
  className,
  children,
}: CollapsibleProps) {
  const [internal, setInternal] = useState(defaultOpen ?? false);
  const current = open ?? internal;
  const contentId = useId();

  const setOpen = (next: boolean) => {
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  };

  return (
    <CollapsibleContext.Provider value={{ open: current, setOpen, contentId }}>
      <div className={className}>{children}</div>
    </CollapsibleContext.Provider>
  );
}

export function CollapsibleTrigger({
  onClick,
  ...props
}: ComponentPropsWithRef<"button">) {
  const { open, setOpen, contentId } = useCollapsible("CollapsibleTrigger");
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={contentId}
      onClick={(event) => {
        onClick?.(event);
        setOpen(!open);
      }}
      {...props}
    />
  );
}

export function CollapsibleContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { open, contentId } = useCollapsible("CollapsibleContent");
  return (
    <div id={contentId} hidden={!open} className={cn(className)}>
      {open && children}
    </div>
  );
}
