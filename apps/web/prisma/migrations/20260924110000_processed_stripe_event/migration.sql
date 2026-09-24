-- Stripe webhook idempotency table (markStripeEventProcessed). The model was
-- added to schema.prisma without a migration, so some databases already have
-- it (created manually or via `db push`) and others don't; IF NOT EXISTS makes
-- this safe for both.
CREATE TABLE IF NOT EXISTS "ProcessedStripeEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedStripeEvent_pkey" PRIMARY KEY ("id")
);
