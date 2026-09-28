import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { ADSTERRA } from "@/components/ads/adsterra-config";

describe("GET /ads/rail", () => {
  it("serves Adsterra's rail snippet with the request nonce on both scripts", async () => {
    const res = GET(new Request("https://www.echoquest.us/ads/rail", { headers: { "x-nonce": "abc123==" } }));
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
    const html = await res.text();
    expect(html).toContain(`"key":"${ADSTERRA.railBanner.key}"`);
    expect(html).toContain(`"format":"iframe"`);
    expect(html).toContain(`<script nonce="abc123==" src="${ADSTERRA.railBanner.src}"></script>`);
    expect(html.match(/nonce="abc123=="/g)).toHaveLength(2);
  });

  it("escapes the nonce and omits it when absent", async () => {
    const hostile = await GET(new Request("https://x/ads/rail", { headers: { "x-nonce": '"><script>' } })).text();
    expect(hostile).not.toContain('"><script>');
    const bare = await GET(new Request("https://x/ads/rail")).text();
    expect(bare).not.toContain("nonce=");
  });
});
