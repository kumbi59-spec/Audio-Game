-- Add cover-image storage to blog posts. Populated by the BFL image-gen
-- pipeline (see /api/admin/blog/[id]/cover and /api/admin/blog/covers).
-- Nullable so existing posts stay valid until covers are generated.
ALTER TABLE "BlogPost" ADD COLUMN "coverImageUrl" TEXT;
