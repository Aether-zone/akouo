import { cn } from "../lib/cn";
import { speakerDot } from "../lib/speaker";
import type { Speaker } from "../lib/speaker";

export interface WaveformProps {
  /** Amplitude peaks, each 0..1. */
  peaks: number[];
  /** Played fraction, 0..1. */
  progress?: number;
  /** Seek callback with the clicked fraction (0..1). */
  onSeek?: (ratio: number) => void;
  /** Tint the played portion with a speaker color instead of the accent. */
  speaker?: Speaker;
  height?: number;
  className?: string;
  "aria-label"?: string;
}

/**
 * A bar's height as a percentage, rounded.
 *
 * Full float precision would put every digit of the computed double into the
 * style attribute, so a peak that differs in its last bits between the server
 * and the browser — which is allowed for `Math.sin` and friends — becomes a
 * hydration mismatch. Two decimals is finer than a pixel at any sane size.
 */
function barHeight(peak: number): string {
  return `${Math.max(6, Math.min(100, peak * 100)).toFixed(2)}%`;
}

/** Seekable amplitude waveform rendered from precomputed peaks. */
export function Waveform({
  peaks,
  progress = 0,
  onSeek,
  speaker,
  height = 48,
  className,
  "aria-label": ariaLabel = "Audio waveform",
}: WaveformProps) {
  const clamped = Math.min(1, Math.max(0, progress));

  function seekFromEvent(clientX: number, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    onSeek?.(Math.min(1, Math.max(0, ratio)));
  }

  const playedClass = speaker ? speakerDot[speaker] : "bg-primary";

  return (
    <div
      role={onSeek ? "slider" : undefined}
      aria-label={onSeek ? ariaLabel : undefined}
      aria-valuemin={onSeek ? 0 : undefined}
      aria-valuemax={onSeek ? 100 : undefined}
      aria-valuenow={onSeek ? Math.round(clamped * 100) : undefined}
      tabIndex={onSeek ? 0 : undefined}
      onClick={(e) => onSeek && seekFromEvent(e.clientX, e.currentTarget)}
      onKeyDown={(e) => {
        if (!onSeek) return;
        if (e.key === "ArrowRight") onSeek(Math.min(1, clamped + 0.02));
        else if (e.key === "ArrowLeft") onSeek(Math.max(0, clamped - 0.02));
      }}
      style={{ height }}
      className={cn(
        "flex w-full items-center gap-px",
        onSeek &&
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {peaks.map((peak, i) => {
        const played = peaks.length > 0 && i / peaks.length < clamped;
        return (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-full",
              played ? playedClass : "bg-muted",
            )}
            style={{ height: barHeight(peak) }}
          />
        );
      })}
    </div>
  );
}
