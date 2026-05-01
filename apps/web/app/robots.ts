import type { MetadataRoute } from "next";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export default function robots(): MetadataRoute.Robots {
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
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
