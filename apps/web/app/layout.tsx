import type { Metadata } from "next";
import "./globals.css";
import { AudioAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { FocusManager } from "@/components/accessibility/FocusManager";

export const metadata: Metadata = {
  title: "Audio RPG — Accessible Interactive Stories",
  description:
    "An audio-first interactive RPG platform. Play narrated choose-your-own-adventure stories with an AI Game Master. Fully accessible for blind and visually impaired players.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <AudioAnnouncer>
          <SkipLinks />
          <FocusManager />
          {children}
        </AudioAnnouncer>
      </body>
    </html>
  );
}
