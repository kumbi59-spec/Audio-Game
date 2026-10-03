import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "World Builder Wizard",
};

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
