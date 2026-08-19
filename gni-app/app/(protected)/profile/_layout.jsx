import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Screen name="support" />

      <Stack.Screen
        name="privacy-policy"
      />

      <Stack.Screen
        name="terms-and-conditions"
      />
    </Stack>
  );
}