import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { AudioAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { FocusManager } from "@/components/accessibility/FocusManager";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { AuthProvider } from "./AuthProvider";
import { VerificationBanner } from "@/components/VerificationBanner";
import { auth } from "@/auth";

const ADSENSE_PUB_ID = process.env["NEXT_PUBLIC_ADSENSE_PUB_ID"] ?? "ca-pub-9267788778991046";
const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EchoQuest — Narrated AI RPG Adventures",
    template: "%s | EchoQuest",
  },
  description:
    "An audio-first AI tabletop RPG platform. Play narrated adventures with an AI Game Master — fully accessible for blind and visually impaired players. Free to start.",
  keywords: [
    "audio RPG", "AI game master", "accessible RPG", "blind gaming",
    "text adventure", "AI storytelling", "narrated adventure", "EchoQuest",
    "tabletop RPG", "interactive fiction", "AI dungeon master",
  ],
  authors: [{ name: "EchoQuest" }],
  creator: "EchoQuest",
  publisher: "EchoQuest",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EchoQuest",
  },
  openGraph: {
    type: "website",
    siteName: "EchoQuest",
    title: "EchoQuest — Narrated AI RPG Adventures",
    description:
      "Play AI-narrated tabletop RPG adventures with a live AI Game Master. Fully accessible for blind and visually impaired players. Free to start.",
    url: SITE_URL,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "EchoQuest — Narrated AI Adventures" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EchoQuest — Narrated AI RPG Adventures",
    description:
      "Play AI-narrated tabletop RPG adventures with a live AI Game Master. Fully accessible. Free to start.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: SITE_URL },
};

export const viewport: Viewport = {
  themeColor: "#7c6af7",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
        {ADSENSE_PUB_ID && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
        <AuthProvider session={session}>
          <AudioAnnouncer>
            <ServiceWorkerRegistrar />
            <SkipLinks />
            <FocusManager />
            <Suspense>
              <VerificationBanner />
            </Suspense>
            {children}
          </AudioAnnouncer>
        </AuthProvider>
      </body>
    </html>
  );
}
