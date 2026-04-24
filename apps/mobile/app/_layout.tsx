import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { registerCommands } from "@/voice/commandBus";
import { installSpeechRecognizer } from "@/voice/install";
// Loading the prefs store at app startup applies the default narrator
// and cue settings to the underlying engines.
import "@/prefs/store";

export default function RootLayout(): JSX.Element {
  useEffect(() => {
    void installSpeechRecognizer();
    // Global utility commands available on every screen.
    return registerCommands({
      "help|what can i do|list commands": () => {
        // UI surfaces a spoken reference list in the Accessibility Center.
      },
      "describe screen": () => {
        // Each screen's useLandmarkAnnounce re-announces when this fires.
      },
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: true,
          headerTitleStyle: { fontSize: 22, fontWeight: "700" },
        }}
      />
    </SafeAreaProvider>
  );
}
