import { Stack } from "expo-router";

import useVexoPrivacyPause from "@/hooks/useVexoPrivacyPause";


export default function PremisesLayout() {
    useVexoPrivacyPause();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}