import { useEffect, useCallback } from "react";
import { Tabs, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/authStore";
import {
  registerForFcmNotifications,
  subscribeToPushTokenChanges,
  getUnreadNotificationCount,
} from "@/services/notificationService";

import { COLORS } from "@/theme";

export default function ProtectedLayout() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id || user?._id;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  // const hasRegistered = useRef(false);
  const safeBottom = Math.max(insets.bottom, 12);
  const tabBarHeight = 68 + safeBottom;

  const unreadCount = useAuthStore(
    (state) => state.unreadNotificationCount
  );

  const setUnreadNotificationCount = useAuthStore(
    (state) => state.setUnreadNotificationCount
  );

  const refreshUnreadCount =
  useCallback(async () => {
    try {
      if (!userId) {
        setUnreadNotificationCount(0);
        return;
      }

      const response =
        await getUnreadNotificationCount(
          userId,
        );

      setUnreadNotificationCount(
        response?.count || 0,
      );
    } catch (error) {
      console.log(
        "refreshUnreadCount error:",
        error?.message || error,
      );
    }
  }, [
    userId,
    setUnreadNotificationCount,
  ]);

 useEffect(() => {
  refreshUnreadCount();
}, [refreshUnreadCount]);

  useEffect(() => {
  if (!userId) return undefined;

 console.log(
  "[PUSH-DEBUG][LAYOUT] Notification effect running",
  {
    userId,
    hasUserId: Boolean(userId),
  },
);

registerForFcmNotifications(userId)
  .then((result) => {
    console.log(
      "[PUSH-DEBUG][LAYOUT] Registration successful",
      {
        userId,
        installationId:
          result?.installationId,
        tokenLast10:
          result?.nativeToken?.slice(-10),
        backendSuccess:
          result?.response?.success,
        backendIsActive:
          result?.response?.device
            ?.isActive,
      },
    );
  })
  .catch((error) => {
    console.log(
      "[PUSH-DEBUG][LAYOUT] Registration failed",
      {
        userId,
        message:
          error?.message ||
          String(error),
      },
    );
  });

  const pushTokenSubscription =
    subscribeToPushTokenChanges(
      userId,
    );

  const receivedSubscription =
    Notifications
      .addNotificationReceivedListener(
        () => {
          /*
           * Read the exact unread count from the
           * server instead of assuming +1.
           */
          refreshUnreadCount();
        },
      );

  const responseSubscription =
  Notifications
    .addNotificationResponseReceivedListener(
      (response) => {
        const data =
          response
            ?.notification
            ?.request
            ?.content
            ?.data || {};

        switch (data.screen) {
          case "events":
            if (data.eventId) {
              router.push({
                pathname:
                  "/(protected)/events/[id]",

                params: {
                  id:
                    String(
                      data.eventId,
                    ),

                  source:
                    "notification",
                },
              });
            } else {
              router.push(
                "/(protected)/events",
              );
            }
            break;

          case "courses":
            router.push(
              "/(protected)/courses",
            );
            break;

          case "calendar":
            router.push(
              "/(protected)/calendar",
            );
            break;

          case "profile":
            router.push(
              "/(protected)/profile",
            );
            break;

          case "notifications":
          default:
            router.push(
              "/(protected)/notifications",
            );
            break;
        }
      },
    );

  return () => {
    pushTokenSubscription.remove();
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}, [
  userId,
  router,
  refreshUnreadCount,
]);

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
     height: tabBarHeight,

  backgroundColor: COLORS.white,

  borderTopWidth: 0,

  paddingTop: 8,
  paddingBottom: safeBottom,

  elevation: 0,
  shadowOpacity: 0,
  },

  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: "500",
  },

  tabBarBadgeStyle: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
  },

  tabBarItemStyle: {
    flex: 1,
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
  listeners={{
    tabPress: (event) => {
      event.preventDefault();

      router.replace(
        "/(protected)/events",
      );
    },
  }}

  options={{
    title: "Events",

    tabBarIcon: ({
      color,
      focused,
    }) => (
      <Ionicons
        name={
          focused
            ? "calendar"
            : "calendar-outline"
        }
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