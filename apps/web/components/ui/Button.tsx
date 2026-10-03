import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent-solid text-on-accent hover:bg-accent-solid/90",
  secondary: "border border-border bg-surface text-foreground hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-foreground",
  danger: "border border-danger/60 text-danger hover:bg-danger/10",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-[44px] px-3 text-sm",
  md: "min-h-[44px] px-4 text-sm",
  lg: "min-h-[48px] px-6 text-base",
};

/**
 * Class names for a button-styled control. Text is centred vertically (the
 * global 44px minimum height otherwise pins link text to the top).
 */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type Common = { variant?: ButtonVariant; size?: ButtonSize };

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & Common>(
  function Button({ variant, size, className, type = "button", ...props }, ref) {
    return <button ref={ref} type={type} className={buttonClasses(variant, size, className)} {...props} />;
  },
);

/** A link that looks like a button. */
export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & Common) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
