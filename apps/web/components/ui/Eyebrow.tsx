import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/** The small uppercase label that sits above a heading. */
export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs font-semibold uppercase tracking-widest text-accent", className)} {...props} />;
}
