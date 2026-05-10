import { NextResponse } from "next/server";

const ADSENSE_SELLER_ID = "f08c47fec0942fa0";

const normalizePublisherId = (rawId: string): string => {
  const trimmed = rawId.trim();
  return trimmed.startsWith("ca-pub-") ? trimmed.slice("ca-pub-".length) : trimmed;
};

const publisherId = normalizePublisherId(process.env.NEXT_PUBLIC_ADSENSE_PUB_ID ?? "pub-9267788778991046");
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
