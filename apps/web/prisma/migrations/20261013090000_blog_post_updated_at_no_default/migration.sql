-- BlogPost.updatedAt is @updatedAt in schema.prisma (Prisma sets it on every
-- write), but the add_blog_posts migration also gave it a database default.
-- Drop it so the database matches the schema and `prisma migrate dev` stops
-- reporting drift.
ALTER TABLE "BlogPost" ALTER COLUMN "updatedAt" DROP DEFAULT;
