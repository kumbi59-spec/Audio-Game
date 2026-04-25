"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function FocusManager() {
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    if (prevPathname.current !== null && prevPathname.current !== pathname) {
      // Move focus to the main heading on route change
      const heading = document.querySelector<HTMLElement>(
        "h1, [data-focus-on-mount]"
      );
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: false });
      }
    }
    prevPathname.current = pathname;
  }, [pathname]);

  return null;
}

// Helper: trap focus inside a container (use for modals/dialogs)
export function trapFocus(container: HTMLElement): () => void {
  const focusable = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handler(e: KeyboardEvent) {
    if (e.key !== "Tab") return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  container.addEventListener("keydown", handler);
  first?.focus();

  return () => container.removeEventListener("keydown", handler);
}
