import type { Config } from "tailwindcss";

/**
 * A theme colour that still takes Tailwind's opacity modifiers. A plain
 * `var(--x)` can't, so `bg-surface/80` used to generate no CSS at all; mixing
 * with transparent works for any colour format the theme uses (hex or rgba).
 */
function token(cssVar: string): string {
  return `color-mix(in srgb, var(${cssVar}) calc(<alpha-value> * 100%), transparent)`;
}

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* EchoQuest design tokens */
        bg:       token("--bg"),
        surface:  token("--surface"),
        "surface-2": token("--surface-2"),
        "surface-3": token("--surface-3"),
        accent:   token("--accent"),
        "accent-solid": token("--accent-solid"),
        "on-accent":    token("--on-accent"),
        "accent-hover": token("--accent-hover"),
        "accent-dim":   token("--accent-dim"),
        success:  token("--success"),
        warning:  token("--warning"),
        danger:   token("--danger"),
        info:     token("--info"),
        border:   token("--border"),
        "border-muted": token("--border-muted"),

        /* Legacy aliases so existing components keep working */
        background:  token("--bg"),
        foreground:  token("--text"),
        card: {
          DEFAULT:    token("--surface"),
          foreground: token("--text"),
        },
        input: token("--border"),
        primary: {
          DEFAULT:    token("--accent"),
          foreground: token("--on-accent"),
        },
        secondary: {
          DEFAULT:    token("--surface"),
          foreground: token("--text"),
        },
        muted: {
          DEFAULT:    token("--surface-2"),
          foreground: token("--text-muted"),
        },
        ring: token("--focus-ring"),
      },
      // bg-primary is a fill under primary-foreground text: use the fill shade.
      backgroundColor: {
        primary: token("--accent-solid"),
      },
      textColor: {
        DEFAULT: token("--text"),
        muted:   token("--text-muted"),
        subtle:  token("--text-subtle"),
      },
      fontFamily: {
        sans:      ["var(--font-inter)", "system-ui", "sans-serif"],
        narration: ["var(--font-lora)", "Georgia", "serif"],
        mono:      ["var(--font-mono, ui-monospace)", "monospace"],
      },
      animation: {
        "fade-slide-in": "fadeSlideIn 0.4s ease-out both",
        "reveal-word":   "revealWord 0.35s ease-out both",
        shimmer:         "shimmer 2s linear infinite",
        "echo-pulse":    "echoQuestPulse 2s ease-in-out infinite",
        "bounce-subtle": "bounce 1.4s ease-in-out infinite",
      },
      keyframes: {
        fadeSlideIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        revealWord: {
          from: { opacity: "0", filter: "blur(3px)" },
          to:   { opacity: "1", filter: "blur(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition:  "200% center" },
        },
        echoQuestPulse: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.5" },
        },
      },
      borderRadius: {
        DEFAULT: "var(--radius, 0.5rem)",
      },
    },
  },
  plugins: [],
};

export default config;
