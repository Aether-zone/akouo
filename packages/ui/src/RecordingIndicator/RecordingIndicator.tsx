import { cn } from "../lib/cn";

export interface RecordingIndicatorProps {
  /** Text shown beside the dot. Pass null for a bare dot. */
  label?: string | null;
  className?: string;
}

/**
 * Live-capture indicator. Uses the theme's `.recording-dot` pulse
 * (defined in `@akouo/theme`, and reduced-motion aware).
 */
export function RecordingIndicator({
  label = "Recording",
  className,
}: RecordingIndicatorProps) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium text-foreground",
        className,
      )}
    >
      <span className="recording-dot size-2 rounded-full" aria-hidden="true" />
      {label && <span>{label}</span>}
      {label && <span className="sr-only">in progress</span>}
    </span>
  );
}
