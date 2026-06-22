import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAuthStore } from "../src/stores/authStore";

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth);

  useEffect(() => {
    loadAuth();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="dark" backgroundColor="#F6F8FC" />
    </SafeAreaProvider>
  );
}