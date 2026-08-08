import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { vexo } from 'vexo-analytics'; 

import { useAuthStore } from "../src/stores/authStore";


const VEXO_API_KEY=process.env.EXPO_PUBLIC_VEXO_API_KEY;

const VEXO_ENABLED=process.env.EXPO_PUBLIC_VEXO_ENABLED === "true";

if (
  VEXO_ENABLED &&
  VEXO_API_KEY
) {
  vexo(
    VEXO_API_KEY,
  );
}

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