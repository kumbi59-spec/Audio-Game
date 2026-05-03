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
const databaseUrl = process.env.DATABASE_URL ?? "";

if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
  console.log("[fix-migrations] skipping: DATABASE_URL is missing or not a postgres:// URL");
  process.exit(0);
}

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

  // Split on statement boundaries (semicolons followed by newlines or end-of-file).
  // Strip comment lines from each chunk rather than dropping the whole chunk — a
  // chunk can start with "-- comment\nALTER TABLE ..." and we must keep the SQL.
  const statements = sql
    .split(/;\s*(?:\n|$)/)
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter((s) => s.length > 0);

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

  if (!ok) {
    // Leave migration unresolved so future deploys can retry it.
    console.error(`[fix-migrations] ${name}: SQL errors above — NOT marking as applied`);
    continue;
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

  console.log(`[fix-migrations] ${name}: ensured ✓`);
}

// Backfill imageUrl on prebuilt worlds that were seeded before imageUrl was set.
const PREBUILT_SVG = [
  { id: "prebuilt-shattered-reaches", imageUrl: "/images/worlds/shattered-reaches.svg" },
  { id: "prebuilt-mirewood",          imageUrl: "/images/worlds/mirewood.svg" },
  { id: "prebuilt-verdant-wilds",     imageUrl: "/images/worlds/verdant-wilds.svg" },
  { id: "prebuilt-iron-citadel",      imageUrl: "/images/worlds/iron-citadel.svg" },
  { id: "prebuilt-crimson-sands",     imageUrl: "/images/worlds/crimson-sands.svg" },
  { id: "prebuilt-neon-precinct",     imageUrl: "/images/worlds/neon-precinct.svg" },
  { id: "prebuilt-long-watch",        imageUrl: "/images/worlds/long-watch.svg" },
  { id: "prebuilt-black-vellum",      imageUrl: "/images/worlds/black-vellum.svg" },
  { id: "prebuilt-saltbound",         imageUrl: "/images/worlds/saltbound.svg" },
];

for (const { id, imageUrl } of PREBUILT_SVG) {
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "World" SET "imageUrl" = $1 WHERE id = $2 AND ("imageUrl" IS NULL OR "imageUrl" = '')`,
      imageUrl,
      id,
    );
  } catch (err) {
    console.warn(`[fix-migrations] imageUrl backfill for ${id}: ${err instanceof Error ? err.message : err}`);
  }
}
console.log("[fix-migrations] prebuilt world imageUrl backfill done ✓");

await prisma.$disconnect();
