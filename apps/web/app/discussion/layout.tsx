import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discussion",
  description: "Talk about EchoQuest worlds, campaigns and audio play with other players.",
};

export default function DiscussionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
