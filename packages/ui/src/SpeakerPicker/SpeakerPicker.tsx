import { useRef, useState } from "react";

import { cn } from "../lib/cn";
import { useOutsideClick } from "../lib/hooks";
import { CheckIcon } from "../lib/icons";
import { SPEAKERS, speakerDot, speakerName } from "../lib/speaker";
import type { Speaker } from "../lib/speaker";

export interface SpeakerPickerProps {
  value: Speaker;
  onChange: (speaker: Speaker) => void;
  /** Optional display names per speaker. */
  names?: Partial<Record<Speaker, string>>;
  disabled?: boolean;
  className?: string;
}

/** Reassign a segment to a speaker from the six-color palette. */
export function SpeakerPicker({
  value,
  onChange,
  names,
  disabled,
  className,
}: SpeakerPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useOutsideClick(containerRef, () => setOpen(false), open);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          aria-hidden="true"
          className={cn("size-2.5 rounded-full", speakerDot[value])}
        />
        {speakerName(value, names?.[value])}
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 min-w-44 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {SPEAKERS.map((speaker) => (
            <li key={speaker}>
              <button
                type="button"
                role="option"
                aria-selected={speaker === value}
                onClick={() => {
                  onChange(speaker);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className={cn("size-2.5 rounded-full", speakerDot[speaker])}
                />
                <span className="flex-1">
                  {speakerName(speaker, names?.[speaker])}
                </span>
                {speaker === value && <CheckIcon width="14" height="14" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
