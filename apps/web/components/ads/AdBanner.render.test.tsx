import { beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// The app compiles JSX with the classic runtime (tsconfig "jsx": "preserve"),
// so the components expect a global React when rendered under vitest.
let AdBanner: typeof import("./AdBanner").AdBanner;

beforeAll(async () => {
  (globalThis as { React?: typeof React }).React = React;
  ({ AdBanner } = await import("./AdBanner"));
});

describe("AdBanner (AdSense off)", () => {
  // The Adsterra display slot depends on viewport width, so it renders only
  // in the browser; server HTML is empty either way (checked in e2e).
  it("never renders the house banner or a text link", () => {
    const html = renderToStaticMarkup(React.createElement(AdBanner));
    expect(html).not.toContain("Playing free");
    expect(html).not.toContain("<a ");
  });

  it("renders nothing on non-ad turns or with fallback none", () => {
    expect(renderToStaticMarkup(React.createElement(AdBanner, { visible: false }))).toBe("");
    expect(renderToStaticMarkup(React.createElement(AdBanner, { fallback: "none" }))).toBe("");
  });
});
