import type { Config } from "tailwindcss";

/**
 * Akouo Tailwind preset.
 *
 * The source of truth for the tokens is `akouo-theme.css` (a Tailwind v4
 * token layer: CSS variables under `:root` / `.dark`, exposed as utilities by
 * its `@theme inline` block). Every app imports that CSS, so a token change
 * there re-skins all three apps at once.
 *
 * This preset mirrors those same token names for JS-config consumers: it wires
 * class-based dark mode (the theme toggles on `.dark`) and re-declares the
 * palette / radius / font tokens so `tailwind.config.ts`, editor IntelliSense,
 * and any JS-driven tooling agree with the CSS. Each app's Tailwind config
 * extends this preset via `presets: [preset]`.
 *
 * Keep the keys here in sync with the `--color-*` / `--radius-*` / `--font-*`
 * names declared in `akouo-theme.css`.
 */
const preset = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        recording: {
          DEFAULT: "hsl(var(--recording))",
          foreground: "hsl(var(--recording-foreground))",
        },
        // Six-color diarization palette — labelling who is talking.
        "speaker-1": "hsl(var(--speaker-1))",
        "speaker-2": "hsl(var(--speaker-2))",
        "speaker-3": "hsl(var(--speaker-3))",
        "speaker-4": "hsl(var(--speaker-4))",
        "speaker-5": "hsl(var(--speaker-5))",
        "speaker-6": "hsl(var(--speaker-6))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
    },
  },
} satisfies Config;

export default preset;
