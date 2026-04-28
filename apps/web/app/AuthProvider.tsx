"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}
