import { useState } from "react";
import type { KeyboardEvent } from "react";

import { cn } from "../lib/cn";
import { XIcon } from "../lib/icons";

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Keys that commit the current draft as a tag. Default: Enter and comma. */
  delimiters?: string[];
  className?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/**
 * Free-entry tag/chip field. Type and press Enter (or comma) to add;
 * Backspace on an empty draft removes the last tag. Controlled via `value`.
 */
export function TagInput({
  value,
  onChange,
  placeholder,
  disabled,
  delimiters = ["Enter", ","],
  className,
  ...aria
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setDraft("");
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (delimiters.includes(event.key)) {
      event.preventDefault();
      addTag(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      removeTag(value.length - 1);
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-1.5 text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {value.map((tag, index) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-sm bg-secondary px-2 py-0.5 text-secondary-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            disabled={disabled}
            aria-label={`Remove ${tag}`}
            className="text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
          >
            <XIcon width="12" height="12" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(draft)}
        placeholder={value.length === 0 ? placeholder : undefined}
        disabled={disabled}
        className="min-w-24 flex-1 bg-transparent px-1 text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
        {...aria}
      />
    </div>
  );
}
