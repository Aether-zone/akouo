import type { ComponentPropsWithRef } from "react";

import { cn } from "../lib/cn";
import { speakerChip, speakerDot, speakerName } from "../lib/speaker";
import type { Speaker } from "../lib/speaker";

export interface SpeakerTagProps
  extends Omit<ComponentPropsWithRef<"span">, "children"> {
  speaker: Speaker;
  name?: string;
  size?: "sm" | "md";
}

const sizes: Record<NonNullable<SpeakerTagProps["size"]>, string> = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2 py-0.5 text-sm",
};

/** Diarization label chip, colored from the speaker palette. */
export function SpeakerTag({
  speaker,
  name,
  size = "md",
  className,
  ...props
}: SpeakerTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        speakerChip[speaker],
        sizes[size],
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", speakerDot[speaker])}
      />
      {speakerName(speaker, name)}
    </span>
  );
}
