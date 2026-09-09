import type { ComponentPropsWithRef } from "react";

import { cn } from "../lib/cn";

export type ProseProps = ComponentPropsWithRef<"div">;

/**
 * Applies readable typography to a block of rich/HTML content (e.g. a rendered
 * transcript or article). Hand-rolled with descendant styles — no plugin.
 */
export function Prose({ className, ...props }: ProseProps) {
  return (
    <div
      className={cn(
        "max-w-prose text-sm leading-7 text-foreground",
        "[&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight",
        "[&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold",
        "[&_p]:my-4",
        "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-1",
        "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
        "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_hr]:my-8 [&_hr]:border-border",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
