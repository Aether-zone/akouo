import { cn } from "../lib/cn";
import { speakerDot, speakerName } from "../lib/speaker";
import type { Speaker } from "../lib/speaker";

export interface SpeakerLegendEntry {
  speaker: Speaker;
  name?: string;
  /** Optional talk-time or count shown on the right. */
  meta?: string;
}

export interface SpeakerLegendProps {
  speakers: SpeakerLegendEntry[];
  className?: string;
}

/** Key of speakers in a session, each with its palette color. */
export function SpeakerLegend({ speakers, className }: SpeakerLegendProps) {
  return (
    <ul className={cn("flex flex-col gap-1.5", className)}>
      {speakers.map(({ speaker, name, meta }) => (
        <li
          key={speaker}
          className="flex items-center gap-2 text-sm text-foreground"
        >
          <span
            aria-hidden="true"
            className={cn("size-2.5 rounded-full", speakerDot[speaker])}
          />
          <span className="flex-1">{speakerName(speaker, name)}</span>
          {meta && (
            <span className="tabular-nums text-xs text-muted-foreground">
              {meta}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
