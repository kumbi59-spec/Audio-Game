import type { Metadata } from "next";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export const metadata: Metadata = {
  title: "Adventure Library",
  description:
    "Browse official EchoQuest campaigns and community-created worlds. Find your next AI-narrated RPG adventure — free to start.",
  alternates: { canonical: `${SITE_URL}/library` },
  openGraph: {
    title: "Adventure Library | EchoQuest",
    description:
      "Browse official EchoQuest campaigns and community-created worlds. Free AI-narrated RPG adventures.",
    url: `${SITE_URL}/library`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adventure Library | EchoQuest",
    description: "Browse official and community AI-narrated RPG worlds. Free to start.",
  },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
