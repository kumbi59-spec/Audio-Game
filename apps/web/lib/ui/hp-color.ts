/** The health bar colour for a share of max HP (0–100), as a theme colour. */
export function hpColor(percent: number): string {
  if (percent > 50) return "var(--success)";
  if (percent > 25) return "var(--warning)";
  return "var(--danger)";
}
