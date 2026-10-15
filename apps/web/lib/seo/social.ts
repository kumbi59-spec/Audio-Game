import type { Metadata } from "next";
import { BRAND_TTRPG, DEFAULT_OG_IMAGE } from "@/lib/seo/brand";

interface SocialInput {
  title: string;
  description: string;
  url: string;
  type: "article" | "website";
}

/**
 * openGraph and twitter metadata for a page. A page's own openGraph/twitter
 * objects replace the root layout's instead of merging with them, so a page
 * that only sets a title and description would be shared with no image, no
 * site name and the homepage's twitter title.
 */
export function socialMetadata({ title, description, url, type }: SocialInput): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type,
      siteName: BRAND_TTRPG,
      locale: "en_US",
      title,
      description,
      url,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      site: "@echoquestapp",
      creator: "@echoquestapp",
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}
