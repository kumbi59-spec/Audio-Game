import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import campaign notes",
};

export default function ImportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
