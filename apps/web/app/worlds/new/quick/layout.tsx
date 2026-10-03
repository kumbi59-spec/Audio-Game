import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quick world build",
};

export default function QuickLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
