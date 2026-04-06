import { Tabs, Redirect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function ProtectedLayout() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="notifications" options={{ title: "Alerts" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />

      {/* 👇 Hide these */}
      <Tabs.Screen name="events" options={{ href: null }} />
    </Tabs>
  );
}