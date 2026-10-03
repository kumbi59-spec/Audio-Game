import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaign lobby",
  robots: { index: false, follow: false },
};

export default function LobbyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
