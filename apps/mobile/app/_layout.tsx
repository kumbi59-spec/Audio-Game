import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect, useRef } from "react";
import { listCommandPhrases, registerCommands } from "@/voice/commandBus";
import { installSpeechRecognizer } from "@/voice/install";
import { describeFocusedScreen } from "@/a11y/useLandmarkAnnounce";
import { speakOnce } from "@/audio/narrator";
import { addNotificationResponseListener } from "@/notifications/register";
// Loading the prefs store at app startup applies the default narrator
// and cue settings to the underlying engines.
import "@/prefs/store";

export default function RootLayout(): JSX.Element {
  const router = useRouter();
  const notifListenerRef = useRef<ReturnType<typeof addNotificationResponseListener> | null>(null);

  useEffect(() => {
    void installSpeechRecognizer();

    notifListenerRef.current = addNotificationResponseListener((response) => {
      const url = response.notification.request.content.data?.["url"] as string | undefined;
      if (url) router.push(url as never);
    });

    // Global utility commands available on every screen.
    const unregister = registerCommands({
      "help|what can i do|list commands": () => {
        // Commands are registered per focused screen, so this lists what
        // works right here plus these global ones.
        void speakOnce(`You can say: ${listCommandPhrases().join(", ")}.`);
      },
      "describe screen": () => {
        if (!describeFocusedScreen()) void speakOnce("Nothing to describe yet.");
      },
    });

    return () => {
      notifListenerRef.current?.remove();
      unregister();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </SafeAreaProvider>
  );
}
