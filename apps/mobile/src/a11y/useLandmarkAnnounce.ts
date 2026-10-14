import { useCallback, useEffect, useRef } from "react";
import { AccessibilityInfo, findNodeHandle } from "react-native";
import type { RefObject } from "react";
import { useFocusEffect } from "expo-router";
import { speakOnce } from "@/audio/narrator";

interface Landmark {
  title: string;
  summary: RefObject<string>;
}

// The focused screen's landmark, re-spoken by the "describe screen" command.
let focusedLandmark: Landmark | null = null;

function landmarkMessage(title: string, summary: string): string {
  return summary ? `${title}. ${summary}` : title;
}

function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
  void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
    if (!enabled) void speakOnce(message);
  });
}

/**
 * Announces a screen's title + summary on mount so screen reader users
 * immediately know where they are and what's available. Also moves
 * accessibility focus to the heading so VoiceOver/TalkBack start there.
 * A changed summary re-announces (a finished load or parse), so keep it
 * free of state that changes every turn; it would cut off narration.
 * The "describe screen" command re-reads the focused screen's landmark.
 */
export function useLandmarkAnnounce(
  title: string,
  summary: string,
  headingRef?: RefObject<{ readonly current: unknown } | unknown>,
): void {
  const summaryRef = useRef(summary);
  summaryRef.current = summary;

  useFocusEffect(
    useCallback(() => {
      const landmark: Landmark = { title, summary: summaryRef };
      focusedLandmark = landmark;
      return () => {
        if (focusedLandmark === landmark) focusedLandmark = null;
      };
    }, [title]),
  );

  useEffect(() => {
    announce(landmarkMessage(title, summary));

    if (headingRef && "current" in headingRef) {
      const node = findNodeHandle(headingRef.current as Parameters<typeof findNodeHandle>[0]);
      if (node != null) {
        AccessibilityInfo.setAccessibilityFocus(node);
      }
    }
  }, [title, summary, headingRef]);
}

/** Re-announces the focused screen with its current summary. */
export function describeFocusedScreen(): boolean {
  if (!focusedLandmark) return false;
  announce(landmarkMessage(focusedLandmark.title, focusedLandmark.summary.current ?? ""));
  return true;
}
