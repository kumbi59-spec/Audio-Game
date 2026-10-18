import { beforeAll, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// next/link prefetches its href. Mark what it renders so a plain <a> can be
// told apart from it.
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ href, children, ...rest }: { href: string; children?: React.ReactNode }) =>
      createElement("a", { ...rest, href, "data-next-link": "" }, children),
  };
});
vi.mock("@/components/SiteHeader", () => ({ SiteHeader: () => null }));
vi.mock("@/components/landing/LandingEffects", () => ({ LandingEffects: () => null }));

// The app compiles JSX with the classic runtime, so render with a global React.
let LandingPage: typeof import("./page").default;

beforeAll(async () => {
  (globalThis as { React?: typeof React }).React = React;
  ({ default: LandingPage } = await import("./page"));
});

describe("landing pricing CTAs", () => {
  it("link to checkout with a plain <a>, which nothing prefetches", () => {
    const html = renderToStaticMarkup(React.createElement(LandingPage));
    const checkoutLinks = html.match(/<a [^>]*href="\/api\/payments\/checkout[^"]*"[^>]*>/g) ?? [];
    expect(checkoutLinks).toHaveLength(2);
    for (const tag of checkoutLinks) expect(tag).not.toContain("data-next-link");
  });
});
