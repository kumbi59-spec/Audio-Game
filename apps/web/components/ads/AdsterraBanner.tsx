"use client";

import { ADSTERRA, ADSTERRA_ENABLED } from "./adsterra-config";
import { nonceAttr, useNonce } from "@/components/security/NonceContext";

type BannerUnit = { key: string; src: string; width: number; height: number };

/**
 * Adsterra iframe-format display banner. Each banner runs in its own srcdoc
 * iframe so the global `atOptions` the invoke script reads can't collide
 * between two banners on one page.
 *
 * The iframe is sandboxed WITHOUT allow-same-origin: an unsandboxed srcdoc
 * document inherits echoquest.us's origin, which would let the third-party
 * invoke script read the parent DOM, localStorage and cookies and call our
 * authenticated APIs. With an opaque origin it can only run inside the frame.
 * The other flags are the minimum an ad needs: scripts to run, and a click
 * (user activation) to open the advertiser's page in a new, unsandboxed tab.
 */
const AD_SANDBOX = "allow-scripts allow-popups allow-popups-to-escape-sandbox";
export function AdsterraBanner({ unit = ADSTERRA.railBanner }: { unit?: BannerUnit }) {
  // srcdoc documents inherit the page's CSP, so their scripts need its nonce.
  const nonce = nonceAttr(useNonce());
  if (!ADSTERRA_ENABLED) return null;
  const options = JSON.stringify({ key: unit.key, format: "iframe", height: unit.height, width: unit.width, params: {} });
  const srcDoc =
    `<!doctype html><html><head><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head>` +
    `<body><script${nonce}>atOptions = ${options};</script><script${nonce} src="${unit.src}"></script></body></html>`;
  return (
    <iframe
      title="Advertisement"
      sandbox={AD_SANDBOX}
      srcDoc={srcDoc}
      width={unit.width}
      height={unit.height}
      scrolling="no"
      style={{ border: 0, display: "block", width: unit.width, height: unit.height }}
    />
  );
}
