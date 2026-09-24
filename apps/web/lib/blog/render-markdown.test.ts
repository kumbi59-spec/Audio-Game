import { describe, expect, it } from "vitest";
import { isSafeUrl, renderBlogMarkdown, serializeJsonLd } from "./render-markdown";

describe("renderBlogMarkdown", () => {
  it("escapes raw block and inline HTML", async () => {
    const html = await renderBlogMarkdown(
      "<script>alert(1)</script>\n\ntext <img src=x onerror=alert(1)> and <a href=\"javascript:alert(1)\">x</a>",
    );
    expect(html).not.toMatch(/<script|<img|<a /i);
    expect(html).toContain("&lt;script&gt;");
  });

  it("drops links and images with unsafe schemes", async () => {
    const html = await renderBlogMarkdown(
      "[a](javascript:alert(1)) [b](&#106;avascript:alert(1)) [c](vbscript:x) ![d](javascript:x) ![e](data:image/svg+xml;base64,PHN2Zz4=)",
    );
    expect(html).not.toMatch(/href=|src=/i);
  });

  it("keeps normal Markdown, safe links and images", async () => {
    const html = await renderBlogMarkdown(
      "## Heading\n\n**bold** [site](https://echoquest.us/x \"t\") [rel](/blog) [mail](mailto:a@b.c) ![alt](https://cdn.example/i.png)",
    );
    expect(html).toContain("<h2>Heading</h2>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('href="https://echoquest.us/x"');
    expect(html).toContain('href="/blog"');
    expect(html).toContain('href="mailto:a@b.c"');
    expect(html).toContain('src="https://cdn.example/i.png"');
  });
});

describe("isSafeUrl", () => {
  it("rejects scheme obfuscation", () => {
    expect(isSafeUrl("java\tscript:alert(1)", "link")).toBe(false);
    expect(isSafeUrl(" JAVASCRIPT:alert(1)", "link")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>", "link")).toBe(false);
  });

  it("allows raster data images only", () => {
    expect(isSafeUrl("data:image/png;base64,iVBORw0KGgo=", "image")).toBe(true);
    expect(isSafeUrl("data:image/svg+xml;base64,PHN2Zz4=", "image")).toBe(false);
  });
});

describe("serializeJsonLd", () => {
  it("cannot terminate the surrounding script tag", () => {
    const out = serializeJsonLd({ headline: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script");
    expect(JSON.parse(out)).toEqual({ headline: "</script><script>alert(1)</script>" });
  });
});
