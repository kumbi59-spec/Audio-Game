import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/** A bordered surface panel, the app's standard container. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-border bg-surface p-5", className)} {...props} />;
}
