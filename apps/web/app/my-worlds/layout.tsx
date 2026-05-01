import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Worlds",
  robots: { index: false, follow: false },
};

export default function MyWorldsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
