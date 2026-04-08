import { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "../../src/stores/authStore";
import { Ionicons } from "@expo/vector-icons";
import { registerForFcmNotifications } from "../../src/services/notificationService";

export default function ProtectedLayout() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const hasRegistered = useRef(false);

  console.log("ProtectedLayout user:", user);

  useEffect(() => {
    console.log("Triggering token registration for:", user?.id);

    if (!user?.id || hasRegistered.current) return;

    hasRegistered.current = true;

    registerForFcmNotifications(user.id)
      .then(({ nativeToken }) => {
        console.log("✅ FCM token registered:", nativeToken);
      })
      .catch((err) => {
        console.log("❌ FCM setup failed:", err.message);
      });

    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📩 Foreground notification:", notification);
      }
    );

    const responseSub =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Notification tapped:", response);

        const data = response.notification.request.content.data || {};

        if (data.screen === "events") router.push("/events");
        if (data.screen === "notifications") router.push("/notifications");
        if (data.screen === "profile") router.push("/profile");
      });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [user?.id]);

  return (
    <Tabs
    screenOptions={{
    tabBarActiveTintColor: "#2563eb",
    tabBarInactiveTintColor: "gray",
  }}>
  <Tabs.Screen
    name="home"
    options={{
      title: "Home",
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="home-outline" size={size} color={color} />
      ),
    }}
  />

  <Tabs.Screen
    name="events"
    options={{
      title: "Events",
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="calendar-outline" size={size} color={color} />
      ),
    }}
  />

  <Tabs.Screen
    name="notifications"
    options={{
      title: "Notifications",
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="notifications-outline" size={size} color={color} />
      ),
    }}
  />

  <Tabs.Screen
    name="calendar"
    options={{
      title: "Calendar",
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="today-outline" size={size} color={color} />
      ),
    }}
  />

  <Tabs.Screen
    name="profile"
    options={{
      title: "Profile",
      tabBarIcon: ({ color, size }) => (
        <Ionicons name="person-outline" size={size} color={color} />
      ),
    }}
  />
  
</Tabs>
  );
}