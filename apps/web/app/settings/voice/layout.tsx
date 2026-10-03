import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voice & narration settings",
};

export default function VoiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
