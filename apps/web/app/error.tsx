"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

/** Shown when a page throws while rendering; the site header and footer stay. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[page error]", error);
  }, [error]);

  return (
    <main id="main-content" className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
      <h1 className="text-3xl font-bold text-foreground" tabIndex={-1} data-focus-on-mount>
        Something went wrong on this page
      </h1>
      <p className="mt-3 text-muted">It&apos;s not you. Try again, and if it keeps happening, head back to the library.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/library" variant="secondary">Back to the library</ButtonLink>
      </div>
    </main>
  );
}
