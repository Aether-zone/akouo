import { SpeakerTag } from "../SpeakerTag";
import { Timecode } from "../Timecode";
import { cn } from "../lib/cn";
import type { Speaker } from "../lib/speaker";

export interface TranscriptSegment {
  id: string;
  speaker: Speaker;
  name?: string;
  /** Segment start in seconds. */
  start: number;
  text: string;
}

export interface TranscriptViewProps {
  segments: TranscriptSegment[];
  /** Current playback position (seconds); highlights the active segment. */
  currentTime?: number;
  /** Jump playback to a segment's start. */
  onSeek?: (seconds: number) => void;
  className?: string;
}

function activeIndex(segments: TranscriptSegment[], time: number): number {
  let index = -1;
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    if (segment && segment.start <= time) index = i;
    else break;
  }
  return index;
}

/** Turn-by-turn transcript with speaker labels and seekable timecodes. */
export function TranscriptView({
  segments,
  currentTime,
  onSeek,
  className,
}: TranscriptViewProps) {
  const active =
    currentTime === undefined ? -1 : activeIndex(segments, currentTime);

  return (
    <ol className={cn("flex flex-col gap-1", className)}>
      {segments.map((segment, i) => {
        const isActive = i === active;
        const interactive = Boolean(onSeek);
        return (
          <li key={segment.id}>
            <div
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={() => onSeek?.(segment.start)}
              onKeyDown={(e) => {
                if (interactive && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSeek?.(segment.start);
                }
              }}
              className={cn(
                "flex flex-col gap-1 rounded-md p-2 transition-colors",
                interactive && "cursor-pointer hover:bg-muted/50",
                isActive && "bg-accent",
                interactive &&
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <div className="flex items-center gap-2">
                <SpeakerTag
                  speaker={segment.speaker}
                  name={segment.name}
                  size="sm"
                />
                <Timecode seconds={segment.start} />
              </div>
              <p className="text-sm leading-6 text-foreground">
                {segment.text}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
