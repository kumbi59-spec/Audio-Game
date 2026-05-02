import { generateAICoverArt } from "@/lib/ai/cover-art-gen";
import { worldCoverDataUrl } from "@/lib/worlds/cover-art";

/**
 * Resolves a cover image URL for a freshly-created world.
 *
 * Tries AI generation first (when IMAGE_GEN_PROVIDER is set), falls back to
 * the deterministic SVG generator on any failure. Both outputs are inline
 * data URLs and stored directly in `World.imageUrl` — no external storage
 * dependency. For high-traffic deployments, swap the AI branch to upload
 * the image to R2/S3 and return the public URL instead of inlining base64.
 */
export async function resolveWorldCoverImage(
  name: string,
  genre: string,
  tone = "",
): Promise<string> {
  const result = await generateAICoverArt({ worldName: name, genre, tone });
  if (result.url) return result.url;
  if (result.error) console.warn(`[cover-art-resolver] AI generation failed (${result.error}), falling back to SVG`);
  return worldCoverDataUrl(name, genre, tone);
}
