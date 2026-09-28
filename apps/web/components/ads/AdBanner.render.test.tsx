import { beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// The app compiles JSX with the classic runtime (tsconfig "jsx": "preserve"),
// so the components expect a global React when rendered under vitest.
let AdBanner: typeof import("./AdBanner").AdBanner;
let ADSTERRA: typeof import("./adsterra-config").ADSTERRA;

beforeAll(async () => {
  (globalThis as { React?: typeof React }).React = React;
  ({ AdBanner } = await import("./AdBanner"));
  ({ ADSTERRA } = await import("./adsterra-config"));
});

describe("AdBanner (AdSense off)", () => {
  it("renders the Adsterra sponsored bar for free users, not the house banner", () => {
    const html = renderToStaticMarkup(React.createElement(AdBanner));
    expect(html).toContain(`href="${ADSTERRA.smartlinkUrl.replace(/&/g, "&amp;")}"`);
    expect(html).toContain('rel="sponsored noopener noreferrer"');
    expect(html).toContain("Sponsored");
    expect(html).not.toContain("Playing free");
  });

  // Paid-tier gating (showAds) isn't exercised here: server rendering reads
  // the store's initial (free) state, not later setTier() calls.
  it("renders nothing on non-ad turns", () => {
    expect(renderToStaticMarkup(React.createElement(AdBanner, { visible: false }))).toBe("");
  });
});
