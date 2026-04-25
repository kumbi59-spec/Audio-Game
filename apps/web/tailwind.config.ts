import type { Config } from "tailwindcss";

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
        bg:       "var(--bg)",
        surface:  "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        accent:   "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-dim":   "var(--accent-dim)",
        success:  "var(--success)",
        warning:  "var(--warning)",
        danger:   "var(--danger)",
        info:     "var(--info)",
        border:   "var(--border)",
        "border-muted": "var(--border-muted)",

        /* Legacy aliases so existing components keep working */
        background:  "var(--bg)",
        foreground:  "var(--text)",
        primary: {
          DEFAULT:    "var(--accent)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT:    "var(--surface)",
          foreground: "var(--text)",
        },
        muted: {
          DEFAULT:    "var(--surface-2)",
          foreground: "var(--text-muted)",
        },
        ring: "var(--focus-ring)",
      },
      textColor: {
        DEFAULT: "var(--text)",
        muted:   "var(--text-muted)",
        subtle:  "var(--text-subtle)",
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
