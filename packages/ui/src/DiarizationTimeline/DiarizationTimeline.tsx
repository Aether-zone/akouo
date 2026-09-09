import { formatTimecode } from "../Timecode";
import { cn } from "../lib/cn";
import { speakerDot, speakerName } from "../lib/speaker";
import type { Speaker } from "../lib/speaker";

export interface DiarizationSegment {
  speaker: Speaker;
  /** Start and end in seconds. */
  start: number;
  end: number;
  name?: string;
}

export interface DiarizationTimelineProps {
  segments: DiarizationSegment[];
  /** Total recording length in seconds. */
  duration: number;
  currentTime?: number;
  onSeek?: (seconds: number) => void;
  height?: number;
  className?: string;
}

/**
 * Horizontal, speaker-colored map of who spoke when across a recording — the
 * signature Akouo diarization view. Seekable when `onSeek` is provided.
 */
export function DiarizationTimeline({
  segments,
  duration,
  currentTime,
  onSeek,
  height = 28,
  className,
}: DiarizationTimelineProps) {
  const interactive = Boolean(onSeek);

  function seekFromEvent(clientX: number, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    onSeek?.(Math.min(duration, Math.max(0, ratio * duration)));
  }

  return (
    <div
      role={interactive ? "slider" : undefined}
      aria-label={interactive ? "Diarization timeline" : undefined}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? Math.round(duration) : undefined}
      aria-valuenow={
        interactive && currentTime !== undefined
          ? Math.round(currentTime)
          : undefined
      }
      tabIndex={interactive ? 0 : undefined}
      onClick={(e) => interactive && seekFromEvent(e.clientX, e.currentTarget)}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "ArrowRight")
          onSeek?.(Math.min(duration, (currentTime ?? 0) + 5));
        else if (e.key === "ArrowLeft")
          onSeek?.(Math.max(0, (currentTime ?? 0) - 5));
      }}
      style={{ height }}
      className={cn(
        "relative w-full overflow-hidden rounded-md bg-muted",
        interactive &&
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {duration > 0 &&
        segments.map((seg, i) => (
          <div
            key={i}
            title={`${speakerName(seg.speaker, seg.name)} · ${formatTimecode(
              seg.start,
            )}–${formatTimecode(seg.end)}`}
            className={cn("absolute inset-y-0", speakerDot[seg.speaker])}
            style={{
              left: `${(seg.start / duration) * 100}%`,
              width: `${((seg.end - seg.start) / duration) * 100}%`,
            }}
          />
        ))}
      {currentTime !== undefined && duration > 0 && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 w-0.5 bg-foreground"
          style={{
            left: `${Math.min(100, Math.max(0, (currentTime / duration) * 100))}%`,
          }}
        />
      )}
    </div>
  );
}
