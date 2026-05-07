export interface PasswordValidationResult {
  ok: true;
}

export interface PasswordValidationFailure {
  ok: false;
  error: string;
}

export type PasswordValidation = PasswordValidationResult | PasswordValidationFailure;

/**
 * Validates a password-change form: checks confirmation match and minimum length.
 */
export function validatePasswordChange(newPw: string, confirmPw: string): PasswordValidation {
  if (newPw !== confirmPw) return { ok: false, error: "New passwords do not match." };
  if (newPw.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  return { ok: true };
}

export interface TierDisplayInfo {
  label: string;
  color: string;
}

const TIER_DISPLAY: Record<string, TierDisplayInfo> = {
  free:        { label: "Free",        color: "#6b7280" },
  storyteller: { label: "Storyteller", color: "#7c3aed" },
  creator:     { label: "Creator",     color: "#d97706" },
  enterprise:  { label: "Enterprise",  color: "#0ea5e9" },
};

const UNKNOWN_TIER: TierDisplayInfo = { label: "Unknown", color: "#6b7280" };

/**
 * Returns the display label and badge colour for a tier string.
 */
export function tierDisplayInfo(tier: string): TierDisplayInfo {
  return TIER_DISPLAY[tier] ?? UNKNOWN_TIER;
}
