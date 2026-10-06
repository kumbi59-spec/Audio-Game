import { beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// The app compiles JSX with the classic runtime, so render with a global React.
let AdsterraBanner: typeof import("./AdsterraBanner").AdsterraBanner;

beforeAll(async () => {
  (globalThis as { React?: typeof React }).React = React;
  ({ AdsterraBanner } = await import("./AdsterraBanner"));
});

describe("AdsterraBanner", () => {
  it("frames /ads/rail with its own origin, which the ad needs to fill", () => {
    const html = renderToStaticMarkup(React.createElement(AdsterraBanner));
    expect(html).toContain('src="/ads/rail"');
    const sandbox = /sandbox="([^"]*)"/.exec(html)?.[1]?.split(" ") ?? [];
    // An opaque-origin frame (no allow-same-origin) left the unit blank.
    expect(sandbox).toEqual(expect.arrayContaining(["allow-scripts", "allow-same-origin", "allow-popups"]));
  });
});
