import { Button } from "@aether-zone/kosmos";
import { useTheme } from "../ThemeProvider";
import { cn } from "../lib/cn";
import { MoonIcon, SunIcon } from "../lib/icons";

export interface ThemeToggleProps {
  className?: string;
  variant?: "ghost" | "outline";
}

/** Button that toggles between light and dark. Requires a <ThemeProvider>. */
export function ThemeToggle({ className, variant = "ghost" }: ThemeToggleProps) {
  const { resolvedTheme, toggle } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      variant={variant}
      onClick={toggle}
      className={cn("w-10 px-0", className)}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
