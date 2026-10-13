import { NextResponse } from "next/server";

const ADSENSE_SELLER_ID = "f08c47fec0942fa0";

const DEFAULT_PUBLISHER_ID = "pub-9267788778991046";

// ads.txt wants "pub-<digits>", while the AdSense tag's client id is
// "ca-pub-<digits>"; accept either (or bare digits). An empty env var counts
// as unset.
const normalizePublisherId = (rawId: string | undefined): string => {
  const trimmed = rawId?.trim();
  if (!trimmed) return DEFAULT_PUBLISHER_ID;
  const digits = /^(?:ca-)?(?:pub-)?(\d+)$/.exec(trimmed)?.[1];
  return digits ? `pub-${digits}` : trimmed;
};

const publisherId = normalizePublisherId(process.env.NEXT_PUBLIC_ADSENSE_PUB_ID);
const adsTxt = `google.com, ${publisherId}, DIRECT, ${ADSENSE_SELLER_ID}`;

export const revalidate = 0;

export function GET() {
  return new NextResponse(`${adsTxt}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
