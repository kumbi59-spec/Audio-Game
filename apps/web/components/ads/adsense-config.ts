/**
 * Google AdSense is off unless NEXT_PUBLIC_ADSENSE_ENABLED=1 at build time.
 *
 * The site's ads are Adsterra. With AdSense loaded but not serving, Google's
 * auto ads (anchor, side rails) and the in-page units rendered an empty ad
 * box and then collapsed it as "unfilled" — ads that showed for a split
 * second and vanished, on desktop and mobile. With it off, the loader script
 * isn't requested and AdBanner shows the Adsterra sponsored bar.
 */
export const ADSENSE_ENABLED = process.env["NEXT_PUBLIC_ADSENSE_ENABLED"] === "1";

export const ADSENSE_LOADER_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9267788778991046";
