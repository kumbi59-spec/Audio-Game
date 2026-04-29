"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import { useEntitlementsStore } from "@/store/entitlements-store";
import type { Tier } from "@audio-rpg/shared";

function TierSync() {
  const { data: session, status } = useSession();
  const setTier = useEntitlementsStore((s) => s.setTier);

  useEffect(() => {
    if (status === "loading") return;
    const tier = (session?.user as { tier?: string } | undefined)?.tier as Tier | undefined;
    if (tier) {
      setTier(tier);
      localStorage.setItem("echoquest-tier", tier);
    } else {
      setTier("free");
      localStorage.removeItem("echoquest-tier");
    }
  }, [session, status, setTier]);

  return null;
}

interface Props {
  children: ReactNode;
  session?: Session | null;
}

export function AuthProvider({ children, session }: Props) {
  return (
    <SessionProvider session={session} refetchInterval={0} refetchOnWindowFocus={false}>
      <TierSync />
      {children}
    </SessionProvider>
  );
}
