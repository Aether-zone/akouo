import { Button, Select } from "@aether-zone/kosmos";
import { cn } from "../lib/cn";
import {
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from "../lib/icons";

export interface TransportControlsProps {
  playing: boolean;
  onPlayPause: () => void;
  /** Seek by a relative number of seconds (e.g. -10 / +10). */
  onSkip?: (deltaSeconds: number) => void;
  skipSeconds?: number;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  speeds?: number[];
  className?: string;
}

/** Playback transport: skip, play/pause, and a speed selector. */
export function TransportControls({
  playing,
  onPlayPause,
  onSkip,
  skipSeconds = 10,
  speed = 1,
  onSpeedChange,
  speeds = [0.75, 1, 1.25, 1.5, 2],
  className,
}: TransportControlsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {onSkip && (
        <Button
          aria-label={`Back ${skipSeconds} seconds`}
          variant="ghost"
          size="sm"
          className="w-8 px-0"
          onClick={() => onSkip(-skipSeconds)}
        >
          <SkipBackIcon />
        </Button>
      )}
      <Button
        aria-label={playing ? "Pause" : "Play"}
        variant="primary"
        className="w-10 px-0"
        onClick={onPlayPause}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </Button>
      {onSkip && (
        <Button
          aria-label={`Forward ${skipSeconds} seconds`}
          variant="ghost"
          size="sm"
          className="w-8 px-0"
          onClick={() => onSkip(skipSeconds)}
        >
          <SkipForwardIcon />
        </Button>
      )}
      {onSpeedChange && (
        <Select
          aria-label="Playback speed"
          value={String(speed)}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="ml-1 h-8 w-20"
        >
          {speeds.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
