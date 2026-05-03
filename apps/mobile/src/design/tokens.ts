/**
 * EchoQuest design tokens for React Native.
 * Source: EchoQuest Design System (colors_and_type.css + Screens.jsx UI kit).
 */

export const EQ = {
  // Backgrounds
  bg:        '#0f1117',
  bg2:       '#080b12',

  // Surfaces
  surface:   '#1a1d2e',
  surface2:  '#111827',
  surface3:  '#243050',

  // Text
  text:      '#e2e8f0',
  textMuted: '#a0aec0',
  textFaint: '#4a5568',

  // Accent — canonical brand violet
  accent:    '#7c6af7',
  accentBg:  '#1e1a3a',
  accent2:   '#a78bfa',

  // Semantic
  success:   '#22c55e',
  danger:    '#ef4444',
  warning:   '#f59e0b',

  // Borders
  border:    '#2d3748',
  border2:   '#1a1d2e',
} as const;

/** Minimum touch / choice target heights (px). */
export const TOUCH_MIN   = 44;
export const CHOICE_MIN  = 52;

/** Border radii (px). */
export const R = {
  sm:   6,
  md:   8,
  lg:   10,
  xl:   12,
  '2xl': 14,
  '3xl': 20,
} as const;

/** Spacing scale (pt/px in RN). */
export const SPACE = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
} as const;

/** Font sizes. */
export const FS = {
  xs:   12,
  sm:   14,
  base: 16,
  md:   17,
  lg:   18,
  xl:   20,
  '2xl': 22,
  '3xl': 28,
  hero:  32,
} as const;




/** Role-based typography tokens. */
export const TYPE = {
  display: {
    fontSize: FS.hero,
    fontWeight: "800",
    letterSpacing: -0.7,
    lineHeight: 40,
  },
  title: {
    fontSize: FS.xl,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  label: {
    fontSize: FS.xs,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    lineHeight: 16,
  },
  caption: {
    fontSize: FS.sm,
    fontWeight: "500",
    letterSpacing: 0.2,
    lineHeight: 20,
  },
} as const;
/**
 * Motion tokens tuned for subtle, readable UI feedback.
 * Keep movement small (1–2px / tiny scale) for accessibility.
 */
export const MOTION = {
  duration: {
    fast: 140,
    normal: 220,
    reveal: 320,
  },
  easing: {
    standard: "easeOutCubic",
    emphasized: "easeOutQuint",
  },
  press: {
    translateY: 1,
    liftY: -1,
    scaleIn: 0.99,
    scaleOut: 1.01,
  },
  subtleOpacity: 0.92,
} as const;
