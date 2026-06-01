import { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/authStore";
import {
  registerForFcmNotifications,
  getUnreadNotificationCount,
} from "@/services/notificationService";

import { COLORS } from "@/theme";

export default function ProtectedLayout() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id || user?._id;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hasRegistered = useRef(false);

  const unreadCount = useAuthStore(
    (state) => state.unreadNotificationCount
  );

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

    registerForFcmNotifications(userId).catch((error) => {
      console.log("FCM setup failed:", error?.message || error);
    });

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      const store = useAuthStore.getState();

      store.setUnreadNotificationCount(
        store.unreadNotificationCount + 1
      );
    });

    const responseSub =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data || {};

        if (data.screen === "events") {
          router.push("/(protected)/events");
        }

        if (data.screen === "notifications") {
          router.push("/(protected)/notifications");
        }

        if (data.screen === "profile") {
          router.push("/(protected)/profile");
        }
      });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [userId, router]);

  const safeBottom = Math.max(insets.bottom, 8);

  const notificationBadge =
    unreadCount > 0
      ? unreadCount > 99
        ? "99+"
        : unreadCount
      : undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,

        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.icon,

        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: safeBottom,

          height: 64 + safeBottom,

          borderRadius: 24,
          backgroundColor: COLORS.white,
          borderTopWidth: 0,

          paddingTop: 10,
          paddingBottom: safeBottom,

          elevation: 8,

          shadowColor: COLORS.black,
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: {
            width: 0,
            height: 8,
          },
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },

        tabBarBadgeStyle: {
          backgroundColor: COLORS.primary,
          color: COLORS.white,
          fontSize: 10,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "today" : "today-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarBadge: notificationBadge,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}