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

describe("AdBanner (no ad unit configured)", () => {
  it("renders nothing", () => {
    expect(renderToStaticMarkup(React.createElement(AdBanner))).toBe("");
    expect(renderToStaticMarkup(React.createElement(AdBanner, { visible: false }))).toBe("");
  });
});
