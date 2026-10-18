/**
 * Google AdSense is on for free-tier visitors. Set
 * NEXT_PUBLIC_ADSENSE_ENABLED=0 at build time to turn it off; the loader
 * script is then never requested and AdBanner renders nothing.
 */
export const ADSENSE_ENABLED = process.env["NEXT_PUBLIC_ADSENSE_ENABLED"] !== "0";

export const ADSENSE_LOADER_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9267788778991046";
