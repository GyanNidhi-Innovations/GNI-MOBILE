import { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "@/stores/authStore";
import { Ionicons } from "@expo/vector-icons";
import {
  registerForFcmNotifications,
  getUnreadNotificationCount,
} from "@/services/notificationService";

export default function ProtectedLayout() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id || user?._id;

  const router = useRouter();
  const hasRegistered = useRef(false);

  const unreadCount = useAuthStore((state) => state.unreadNotificationCount);
  const setUnreadNotificationCount = useAuthStore(
    (state) => state.setUnreadNotificationCount
  );

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        if (!userId) return;

        const res = await getUnreadNotificationCount(userId);
        setUnreadNotificationCount(res?.count || 0);
      } catch (error) {
        console.log("fetchUnreadCount error:", error);
      }
    };

    fetchUnreadCount();
  }, [userId, setUnreadNotificationCount]);

  useEffect(() => {
    if (!userId || hasRegistered.current) return;

    hasRegistered.current = true;

    registerForFcmNotifications(userId).catch((err) => {
      console.log("FCM setup failed:", err.message);
    });

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      const currentCount = useAuthStore.getState().unreadNotificationCount;
      useAuthStore.getState().setUnreadNotificationCount(currentCount + 1);
    });

    const responseSub =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data || {};

        if (data.screen === "events") router.push("/events");
        if (data.screen === "notifications") router.push("/notifications");
        if (data.screen === "profile") router.push("/profile");
      });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [userId, router]);

  return (
    
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#6b7280",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: "#f9fafb",
        },
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 0,
        },
      }}
    >
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
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
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