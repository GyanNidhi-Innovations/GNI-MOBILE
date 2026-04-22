import { Stack } from "expo-router";

export default function EventsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: "#f9fafb",
        },
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Events",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Event Details",
        }}
      />
    </Stack>
  );
}