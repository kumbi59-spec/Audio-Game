import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/library", "/blog"],
        disallow: [
          "/admin",
          "/account",
          "/play",
          "/settings",
          "/my-worlds",
          "/create",
          "/worlds/new",
          "/api/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
