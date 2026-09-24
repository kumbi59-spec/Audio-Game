import { describe, expect, it } from "vitest";
import { stripPlaceholderImages } from "./placeholder-images";

describe("stripPlaceholderImages", () => {
  it("removes hero and inline world-cover images, keeping surrounding text", () => {
    const md = [
      "# Title",
      "",
      "![A forest](/images/worlds/verdant-wilds.svg)",
      "",
      "Intro paragraph.",
      "",
      "## Section",
      "",
      "![Mist](/images/worlds/mirewood.svg)",
      "",
      "Body text.",
    ].join("\n");
    expect(stripPlaceholderImages(md)).toBe("# Title\n\nIntro paragraph.\n\n## Section\n\nBody text.");
  });

  it("removes absolute-URL and HTML variants", () => {
    const md = 'A ![x](https://echoquest.us/images/worlds/saltbound.svg) b <img src="/images/worlds/long-watch.svg" alt="y"> c';
    expect(stripPlaceholderImages(md)).toBe("A  b  c");
  });

  it("leaves other images and plain content untouched", () => {
    const md = "Text\n\n\n![BFL art](/api/blog/image/abc123)\n\n[link](/images/worlds/)";
    expect(stripPlaceholderImages(md)).toBe(md);
  });
});
