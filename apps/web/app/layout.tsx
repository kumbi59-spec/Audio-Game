import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Lora } from "next/font/google";
import { NonceProvider } from "@/components/security/NonceContext";
import { Suspense } from "react";
import "./globals.css";
import { AudioAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { FocusManager } from "@/components/accessibility/FocusManager";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { AuthProvider } from "./AuthProvider";
import { VerificationBanner } from "@/components/VerificationBanner";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeApplier } from "@/components/accessibility/ThemeApplier";
import { A11Y_STORAGE_KEY, displayModesBootScript } from "@/lib/a11y/display-prefs";
import { AudioUnlocker } from "@/components/audio/AudioUnlocker";
import { AdsterraGlobal } from "@/components/ads/AdsterraGlobal";
import { AdRails } from "@/components/ads/AdRails";
import { AdPreviewBadge } from "@/components/ads/AdPreviewBadge";
import { AdsServerProvider } from "@/components/ads/AdsServerContext";
import { ADSTERRA, ADSTERRA_ENABLED, ADSTERRA_EXCLUDED_PREFIXES } from "@/components/ads/adsterra-config";
import { HIDE_ADS_COOKIE } from "@/lib/ads/hide-ads";
import { ADSENSE_ENABLED, ADSENSE_LOADER_SRC } from "@/components/ads/adsense-config";
import { TIER_ENTITLEMENTS, type Tier } from "@audio-rpg/shared";
import { cookies, headers } from "next/headers";
import { auth } from "@/auth";
import { BRAND_DEFINITION, BRAND_NAME, BRAND_TTRPG } from "@/lib/seo/brand";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.us";

// Self-hosted at build time; the Tailwind font families read these variables.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EchoQuest TTRPG — Audio RPG With an AI Game Master",
    template: `%s | ${BRAND_TTRPG}`,
  },
  description: `${BRAND_DEFINITION} Play with an AI Game Master by voice or keyboard. Free to start.`,
  keywords: [
    "EchoQuest TTRPG", "EchoQuest audio RPG", "audio RPG", "AI game master RPG",
    "play TTRPG with AI GM", "accessible TTRPG screen reader", "audio games for the blind",
    "blind accessible RPG games", "audio tabletop game", "audio first RPG",
    "interactive audio stories game", "AI dungeon master", "tabletop RPG", "interactive fiction",
  ],
  authors: [{ name: BRAND_NAME }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND_NAME,
  },
  openGraph: {
    type: "website",
    siteName: BRAND_TTRPG,
    locale: "en_US",
    title: "EchoQuest TTRPG — Audio RPG With an AI Game Master",
    description: `${BRAND_DEFINITION} Live AI Game Master, built for blind players. Free to start.`,
    url: SITE_URL,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "EchoQuest TTRPG — audio RPG with an AI Game Master" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@echoquestapp",
    creator: "@echoquestapp",
    title: "EchoQuest TTRPG — Audio RPG With an AI Game Master",
    description: `${BRAND_DEFINITION} Fully accessible. Free to start.`,
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

  // Free-tier (and signed-out) visitors get Adsterra's page-level script in
  // the server HTML, where "View page source" shows it and it runs as the
  // page loads. Paid/admin sessions, anyone who switched on "Hide ads" in the
  // accessibility settings, and the gameplay/admin/auth/account routes never do.
  const sessionUser = session?.user as { tier?: string; isAdmin?: boolean } | undefined;
  // Admins never get ads, whatever tier their session token carries.
  const tier = (sessionUser?.isAdmin ? "creator" : sessionUser?.tier ?? "free") as Tier;
  const adsHidden = (await cookies()).get(HIDE_ADS_COOKIE)?.value === "1";
  const serverShowsAds = ADSTERRA_ENABLED && !adsHidden && (TIER_ENTITLEMENTS[tier]?.showAds ?? true);
  // Reading the request headers (the per-request CSP nonce, the session) makes
  // every page render per request, so page-level `revalidate` and
  // Cache-Control rules for pages have no effect; none are set.
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "";
  // Set by middleware; every script we render carries it (lib/security/csp.ts).
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const pageLevelAds = serverShowsAds && !ADSTERRA_EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    // The boot script sets display classes on <html> before React hydrates,
    // so the server's markup never matches them exactly.
    <html lang="en" className={`${inter.variable} ${lora.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: displayModesBootScript(A11Y_STORAGE_KEY) }} />
      </head>
      <body className="min-h-screen antialiased bg-bg text-foreground">
        <ThemeApplier />
        {ADSENSE_ENABLED && (
          <Script
            id="adsense-loader"
            strategy="beforeInteractive"
            src={ADSENSE_LOADER_SRC}
            crossOrigin="anonymous"
            nonce={nonce}
          />
        )}
        <NonceProvider nonce={nonce}>
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
              <SiteFooter />
              <Suspense>
                <AdRails />
              </Suspense>
              <AdPreviewBadge />
            </AudioAnnouncer>
          </AdsServerProvider>
        </AuthProvider>
        </NonceProvider>
        {pageLevelAds && (
          <script id="adsterra-social-bar" async data-cfasync="false" src={ADSTERRA.socialBarSrc} nonce={nonce} />
        )}
      </body>
    </html>
  );
}
