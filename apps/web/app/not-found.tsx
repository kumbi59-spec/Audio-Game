import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">404</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">This path goes nowhere</h1>
        <p className="mt-3 text-muted">
          The page you were after isn&apos;t here. It may have moved, or the link was mistyped.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/library">Browse the library</ButtonLink>
          <ButtonLink href="/" variant="secondary">Go home</ButtonLink>
        </div>
      </main>
    </>
  );
}
