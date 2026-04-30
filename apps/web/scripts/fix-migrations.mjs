#!/usr/bin/env node
/**
 * Clears any failed migration records before prisma migrate deploy runs.
 * Called from the `build` script so it executes during Render's build phase,
 * before the startCommand's `prisma migrate deploy`.
 *
 * Using the Prisma CLI rather than raw SQL so we don't need a pg dependency.
 */
import { execSync } from "child_process";

const STUCK_MIGRATIONS = [
  "20260429120000_add_tts_chars",
  "20260430000000_add_ai_minutes_reset_at",
];

for (const name of STUCK_MIGRATIONS) {
  try {
    execSync(`npx prisma migrate resolve --applied "${name}"`, {
      stdio: "pipe",
      env: process.env,
    });
    console.log(`[pre-deploy] Marked ${name} as applied.`);
  } catch {
    // Migration may already be applied or not exist — either is fine.
  }
}
