/**
 * Whether the wizard's page-wide shortcuts should leave a keydown alone:
 * a handler already took it (a choice option advancing on Enter), the
 * player is typing in a field, or Enter is about to activate the focused
 * button, link or option itself. Handling those too would advance twice.
 */
export function wizardKeyHandledElsewhere(e: Pick<KeyboardEvent, "key" | "defaultPrevented" | "target">): boolean {
  if (e.defaultPrevented) return true;
  const target = e.target as { tagName?: string; getAttribute?: (name: string) => string | null } | null;
  const tag = target?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  if (e.key !== "Enter") return false;
  return tag === "button" || tag === "a" || target?.getAttribute?.("role") === "radio";
}
