import { RecordingIndicator } from "../RecordingIndicator";
import { cn } from "../lib/cn";

export interface LiveCaptionProps {
  /** Text that has been finalized by the recognizer. */
  finalText?: string;
  /** In-progress hypothesis, shown dimmed until finalized. */
  partialText?: string;
  /** Show the live recording indicator. Default true. */
  active?: boolean;
  className?: string;
}

/** Streaming caption: finalized text with a dimmed partial tail. */
export function LiveCaption({
  finalText,
  partialText,
  active = true,
  className,
}: LiveCaptionProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      {active && <RecordingIndicator label="Live" />}
      <p
        aria-live="polite"
        className="min-h-6 text-sm leading-6 text-foreground"
      >
        {finalText}
        {finalText && partialText ? " " : null}
        {partialText && (
          <span className="text-muted-foreground">{partialText}</span>
        )}
      </p>
    </div>
  );
}
