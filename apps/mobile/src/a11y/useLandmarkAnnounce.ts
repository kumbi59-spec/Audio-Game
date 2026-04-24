import { useEffect } from "react";
import { AccessibilityInfo, findNodeHandle } from "react-native";
import type { RefObject } from "react";

/**
 * Announces a screen's title + summary on mount so screen reader users
 * immediately know where they are and what's available. Also moves
 * accessibility focus to the heading so VoiceOver/TalkBack start there.
 */
export function useLandmarkAnnounce(
  title: string,
  summary: string,
  headingRef?: RefObject<{ readonly current: unknown } | unknown>,
): void {
  useEffect(() => {
    const message = summary ? `${title}. ${summary}` : title;
    AccessibilityInfo.announceForAccessibility(message);

    if (headingRef && "current" in headingRef) {
      const node = findNodeHandle(headingRef.current as Parameters<typeof findNodeHandle>[0]);
      if (node != null) {
        AccessibilityInfo.setAccessibilityFocus(node);
      }
    }
  }, [title, summary, headingRef]);
}
