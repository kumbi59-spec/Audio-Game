import { ADSTERRA } from "@/components/ads/adsterra-config";

/**
 * The Adsterra 160×600 rail banner as its own page, framed by AdsterraBanner.
 *
 * It used to be a srcdoc iframe. Inside srcdoc, location is "about:srcdoc"
 * with an empty hostname, so the ad script could not see which site it was
 * running on and the banner never filled. Served from a real URL on our
 * domain, the script sees the site's hostname. The frame keeps that origin
 * (see AD_SANDBOX in AdsterraBanner for why it can't be opaque).
 *
 * The snippet is Adsterra's standard install code, written inline so its
 * document.write runs during parsing. Scripts carry the request's CSP nonce.
 */
export const dynamic = "force-dynamic";

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function GET(req: Request) {
  const unit = ADSTERRA.railBanner;
  const rawNonce = req.headers.get("x-nonce");
  const nonce = rawNonce ? ` nonce="${escapeAttr(rawNonce)}"` : "";
  const options = JSON.stringify({ key: unit.key, format: "iframe", height: unit.height, width: unit.width, params: {} });
  const html =
    `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex">` +
    `<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body>` +
    `<script${nonce}>atOptions = ${options};</script>` +
    `<script${nonce} src="${escapeAttr(unit.src)}"></script>` +
    `</body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
