import { createContext, useContext } from "react";
import type { ComponentPropsWithRef, ReactNode, RefObject } from "react";

import { cn } from "./cn";
import { XIcon } from "./icons";

/**
 * Shared context + presentational parts for modal overlays (Dialog, Drawer).
 * Both providers feed this context, so the header/title/close parts work under
 * either without duplication.
 */
export interface OverlayContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
  contentRef: RefObject<HTMLDivElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useOverlayContext(component: string): OverlayContextValue {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error(`${component} must be used within its overlay root`);
  return ctx;
}

export function OverlayHeader({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div className={cn("flex flex-col gap-1.5 p-6 pb-0", className)} {...props} />
  );
}

export function OverlayFooter({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 p-6 pt-0 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export function OverlayBody({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function OverlayTitle({
  className,
  ...props
}: ComponentPropsWithRef<"h2">) {
  const { titleId } = useOverlayContext("Title");
  return (
    <h2
      id={titleId}
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function OverlayDescription({
  className,
  ...props
}: ComponentPropsWithRef<"p">) {
  const { descriptionId } = useOverlayContext("Description");
  return (
    <p
      id={descriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function OverlayClose({
  className,
  children,
  onClick,
  ...props
}: ComponentPropsWithRef<"button"> & { children?: ReactNode }) {
  const { setOpen } = useOverlayContext("Close");
  const bare = children === undefined;
  return (
    <button
      type="button"
      aria-label={bare ? "Close" : undefined}
      onClick={(event) => {
        onClick?.(event);
        setOpen(false);
      }}
      className={cn(
        bare &&
          "absolute right-4 top-4 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      {children ?? <XIcon />}
    </button>
  );
}
