/**
 * Diarization palette helpers. Class strings are written in full so Tailwind's
 * scanner keeps `--speaker-1..6` utilities in the build.
 */
export type Speaker = 1 | 2 | 3 | 4 | 5 | 6;

export const SPEAKERS: readonly Speaker[] = [1, 2, 3, 4, 5, 6];

export const speakerDot: Record<Speaker, string> = {
  1: "bg-speaker-1",
  2: "bg-speaker-2",
  3: "bg-speaker-3",
  4: "bg-speaker-4",
  5: "bg-speaker-5",
  6: "bg-speaker-6",
};

export const speakerText: Record<Speaker, string> = {
  1: "text-speaker-1",
  2: "text-speaker-2",
  3: "text-speaker-3",
  4: "text-speaker-4",
  5: "text-speaker-5",
  6: "text-speaker-6",
};

export const speakerChip: Record<Speaker, string> = {
  1: "bg-speaker-1/15 text-speaker-1",
  2: "bg-speaker-2/15 text-speaker-2",
  3: "bg-speaker-3/15 text-speaker-3",
  4: "bg-speaker-4/15 text-speaker-4",
  5: "bg-speaker-5/15 text-speaker-5",
  6: "bg-speaker-6/15 text-speaker-6",
};

export const speakerBorder: Record<Speaker, string> = {
  1: "border-speaker-1",
  2: "border-speaker-2",
  3: "border-speaker-3",
  4: "border-speaker-4",
  5: "border-speaker-5",
  6: "border-speaker-6",
};

/** Default label when a speaker has not been named. */
export function speakerName(speaker: Speaker, name?: string): string {
  return name?.trim() || `Speaker ${speaker}`;
}
