import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a world",
};

export default function NewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
