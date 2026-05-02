#!/usr/bin/env node
/**
 * Ensures stuck migrations are actually applied to the DB, then marks them
 * as resolved in Prisma's tracking table so `prisma migrate deploy` skips them.
 *
 * Previous version only marked migrations as "applied" without running the SQL,
 * so tables/columns were never actually created in production. This version runs
 * each SQL statement individually (catching "already exists" errors) so the
 * schema is reconciled before the Next.js build starts.
 *
 * Called from the `build` script:
 *   "build": "node scripts/fix-migrations.mjs; next build"
 */
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dir = dirname(fileURLToPath(import.meta.url));

const MIGRATIONS = [
  "20260429120000_add_tts_chars",
  "20260430000000_add_ai_minutes_reset_at",
  "20260430010000_add_email_verified",
  "20260501000000_add_blog_posts",
];

const prisma = new PrismaClient();

for (const name of MIGRATIONS) {
  const sqlPath = resolve(__dir, `../prisma/migrations/${name}/migration.sql`);
  if (!existsSync(sqlPath)) {
    console.log(`[fix-migrations] ${name}: SQL file not found — skipping`);
    continue;
  }

  const sql = readFileSync(sqlPath, "utf8");

  // Split on statement boundaries (semicolons followed by newlines or end-of-file)
  // and strip comment-only blocks.
  const statements = sql
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let ok = true;
  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // "already exists" errors are expected on re-runs — safe to ignore.
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate column") ||
        msg.includes("42701") || // duplicate_column
        msg.includes("42P07")    // duplicate_table
      ) {
        console.log(`[fix-migrations] ${name}: "${msg.slice(0, 80)}" — already applied, skipping`);
      } else {
        console.error(`[fix-migrations] ${name}: unexpected error: ${msg}`);
        ok = false;
      }
    }
  }

  // Mark as applied in Prisma's _prisma_migrations table so migrate deploy skips it.
  try {
    execSync(`npx prisma migrate resolve --applied "${name}"`, {
      stdio: "pipe",
      env: process.env,
      cwd: resolve(__dir, ".."),
    });
  } catch {
    // Already recorded as applied — fine.
  }

  console.log(`[fix-migrations] ${name}: ${ok ? "ensured ✓" : "partial (errors above)"}`);
}

await prisma.$disconnect();
