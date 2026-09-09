import { cn } from "../lib/cn";
import { Select } from "@aether-zone/kosmos";

export interface TimePickerProps {
  /** 24-hour "HH:mm", or "" when unset. */
  value: string;
  onChange: (value: string) => void;
  /** Minute granularity. Default 5. */
  minuteStep?: number;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Time field as themed hour + minute selects, avoiding native-input quirks. */
export function TimePicker({
  value,
  onChange,
  minuteStep = 5,
  disabled,
  className,
  "aria-label": ariaLabel = "Time",
}: TimePickerProps) {
  const [hour = "", minute = ""] = value.split(":");

  const hours = Array.from({ length: 24 }, (_, i) => pad(i));
  const minutes = Array.from(
    { length: Math.ceil(60 / minuteStep) },
    (_, i) => pad(i * minuteStep),
  );

  function update(nextHour: string, nextMinute: string) {
    if (!nextHour || !nextMinute) return;
    onChange(`${nextHour}:${nextMinute}`);
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex items-center gap-1.5", className)}
    >
      <Select
        aria-label="Hour"
        disabled={disabled}
        value={hour}
        onChange={(e) => update(e.target.value, minute || minutes[0] || "00")}
        className="w-20"
      >
        <option value="" disabled>
          HH
        </option>
        {hours.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select
        aria-label="Minute"
        disabled={disabled}
        value={minute}
        onChange={(e) => update(hour || hours[0] || "00", e.target.value)}
        className="w-20"
      >
        <option value="" disabled>
          MM
        </option>
        {minutes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Select>
    </div>
  );
}
