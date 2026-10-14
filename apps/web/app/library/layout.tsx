import type { Metadata } from "next";
import { socialMetadata } from "@/lib/seo/social";
import { BRAND_TTRPG } from "@/lib/seo/brand";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.us";

export const metadata: Metadata = {
  title: "Adventure Library",
  description:
    "Browse official EchoQuest campaigns and community-created worlds. Find your next AI-narrated RPG adventure — free to start.",
  alternates: { canonical: `${SITE_URL}/library` },
  ...socialMetadata({
    title: `Adventure Library | ${BRAND_TTRPG}`,
    description:
      "Browse official EchoQuest campaigns and community-created worlds. Free AI-narrated RPG adventures.",
    url: `${SITE_URL}/library`,
    type: "website",
  }),
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
