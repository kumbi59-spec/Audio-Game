import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { DisplaySettings } from "./DisplaySettings";

export const metadata: Metadata = {
  title: "Display & accessibility settings",
  description: "Light or dark theme, high contrast, large text and reduced motion for EchoQuest.",
};

export default function DisplaySettingsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground">Display &amp; accessibility</h1>
        <p className="mt-2 text-sm text-muted">
          These settings are saved on this device. Turning on high contrast or reduced motion in your
          device&apos;s own settings always applies here too.
        </p>
        <DisplaySettings />
      </main>
    </>
  );
}
