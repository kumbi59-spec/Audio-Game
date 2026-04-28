import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AudioAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { FocusManager } from "@/components/accessibility/FocusManager";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { AuthProvider } from "./AuthProvider";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "EchoQuest — Narrated AI Adventures",
  description:
    "An audio-first interactive RPG platform. Play narrated AI-driven adventures with an AI Game Master. Fully accessible for blind and visually impaired players.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EchoQuest",
  },
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
        <AuthProvider session={session}>
          <AudioAnnouncer>
            <ServiceWorkerRegistrar />
            <SkipLinks />
            <FocusManager />
            {children}
          </AudioAnnouncer>
        </AuthProvider>
      </body>
    </html>
  );
}
