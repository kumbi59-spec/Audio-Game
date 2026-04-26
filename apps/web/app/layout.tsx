import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { AudioAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { FocusManager } from "@/components/accessibility/FocusManager";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { AuthProvider } from "./AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EchoQuest — Narrated AI Adventures",
  description:
    "An audio-first interactive RPG platform. Play narrated AI-driven adventures with an AI Game Master. Fully accessible for blind and visually impaired players.",
  manifest: "/manifest.json",
  themeColor: "#7c6af7",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EchoQuest",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="min-h-screen antialiased" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
        <AuthProvider>
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
