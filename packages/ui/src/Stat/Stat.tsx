import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  /** Change indicator, e.g. "+12%". */
  delta?: ReactNode;
  trend?: "up" | "down" | "neutral";
  /** Secondary line under the value. */
  hint?: ReactNode;
  className?: string;
}

const trendClass: Record<NonNullable<StatProps["trend"]>, string> = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground",
};

function TrendArrow({ trend }: { trend: "up" | "down" | "neutral" }) {
  if (trend === "neutral") return null;
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={trend === "down" ? "rotate-180" : undefined}
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

/** Single metric tile: label, value, and an optional trend delta. */
export function Stat({ label, value, delta, trend, hint, className }: StatProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 text-card-foreground",
        className,
      )}
    >
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-sm font-medium",
              trend && trendClass[trend],
            )}
          >
            {trend && <TrendArrow trend={trend} />}
            {delta}
          </span>
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
