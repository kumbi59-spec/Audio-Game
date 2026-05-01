import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a World",
  robots: { index: false, follow: false },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
