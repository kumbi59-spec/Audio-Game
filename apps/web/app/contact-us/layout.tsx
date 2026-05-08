import type { Metadata } from "next";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Report bugs, technical problems, or suggestions for EchoQuest. We read every message.",
  alternates: { canonical: `${SITE_URL}/contact-us` },
  openGraph: {
    title: "Contact EchoQuest",
    description: "Report bugs or send feedback to the EchoQuest team.",
    url: `${SITE_URL}/contact-us`,
    type: "website",
  },
};

export default function ContactUsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
