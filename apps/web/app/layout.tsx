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
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { AudioUnlocker } from "@/components/audio/AudioUnlocker";
import { AdsterraGlobal } from "@/components/ads/AdsterraGlobal";
import { AdRails } from "@/components/ads/AdRails";
import { AdsServerProvider } from "@/components/ads/AdsServerContext";
import { ADSTERRA, ADSTERRA_ENABLED, ADSTERRA_EXCLUDED_PREFIXES } from "@/components/ads/adsterra-config";
import { TIER_ENTITLEMENTS, type Tier } from "@audio-rpg/shared";
import { headers } from "next/headers";
import { auth } from "@/auth";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.us";

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
    locale: "en_US",
    title: "EchoQuest — Narrated AI RPG Adventures",
    description:
      "Play AI-narrated tabletop RPG adventures with a live AI Game Master. Fully accessible for blind and visually impaired players. Free to start.",
    url: SITE_URL,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "EchoQuest — Narrated AI Adventures" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@echoquestapp",
    creator: "@echoquestapp",
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
  // Canonical is set per-page (or per-route layout for client-component pages)
  // so we don't blanket-canonicalize every URL to the site root.
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

  // Free-tier (and signed-out) visitors get Adsterra's page-level scripts in
  // the server HTML, where "View page source" shows them and they run as the
  // page loads. Paid/admin sessions and the gameplay/admin/auth/account
  // routes never do.
  const tier = ((session?.user as { tier?: string } | undefined)?.tier ?? "free") as Tier;
  const serverShowsAds = ADSTERRA_ENABLED && (TIER_ENTITLEMENTS[tier]?.showAds ?? true);
  const pathname = (await headers()).get("x-pathname") ?? "";
  const pageLevelAds = serverShowsAds && !ADSTERRA_EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
        <Script
          id="adsense-loader"
          strategy="beforeInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9267788778991046"
          crossOrigin="anonymous"
        />
        <Suspense>
          <GoogleAnalytics />
        </Suspense>
        <AudioUnlocker />
        <AuthProvider session={session}>
          <AdsServerProvider value={serverShowsAds}>
            <AudioAnnouncer>
              <ServiceWorkerRegistrar />
              <Suspense>
                <AdsterraGlobal />
              </Suspense>
              <SkipLinks />
              <FocusManager />
              <Suspense>
                <VerificationBanner />
              </Suspense>
              {children}
              <Suspense>
                <AdRails />
              </Suspense>
            </AudioAnnouncer>
          </AdsServerProvider>
        </AuthProvider>
        {pageLevelAds && (
          <>
            <script id="adsterra-popunder" async data-cfasync="false" src={ADSTERRA.popunderSrc} />
            <script id="adsterra-social-bar" async data-cfasync="false" src={ADSTERRA.socialBarSrc} />
          </>
        )}
      </body>
    </html>
  );
}
