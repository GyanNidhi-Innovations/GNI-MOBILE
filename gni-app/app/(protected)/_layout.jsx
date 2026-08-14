import { useEffect, useCallback, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/authStore";
import {
  registerForFcmNotifications,
  subscribeToPushTokenChanges,
  getUnreadNotificationCount,
  markNotificationCampaignOpened,
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

  const handledNotificationResponsesRef =
    useRef(new Set());

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
     if (__DEV__) {
    console.warn(
      "refreshUnreadCount error:",
      error?.message || error,
    );
  }
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

 

 registerForFcmNotifications(
  userId,
).catch((error) => {
  if (__DEV__) {
    console.warn(
      "Notification registration failed:",
      error?.message || error,
    );
  }
});

  const openNotificationDestination =
    (data = {}) => {
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
          router.push(
            "/(protected)/notifications",
          );
          break;
        
        default:
          router.replace(
            "/(protected)/home",
          );
          break;
      }
    };

  const handleNotificationResponse =
    async (response) => {
      const request =
        response?.notification
          ?.request;

      const responseKey =
        String(
          request?.identifier ||
            response?.actionIdentifier ||
            "",
        );

      if (
        responseKey &&
        handledNotificationResponsesRef
          .current
          .has(responseKey)
      ) {
        return;
      }

      if (responseKey) {
        handledNotificationResponsesRef
          .current
          .add(responseKey);
      }

      const data =
        request?.content?.data ||
        {};

      const campaignId =
        String(
          data.campaignId ||
            "",
        ).trim();

      if (campaignId) {
        try {
          await markNotificationCampaignOpened(
            campaignId,
          );
        } catch (error) {
          /*
           * Opening the intended screen is more
           * important than analytics reporting.
           */
         if (__DEV__) {
    console.warn(
      "mark notification opened error:",
      error?.message || error,
    );
  }
        }
      }

      openNotificationDestination(
        data,
      );

      refreshUnreadCount();
    };

  const pushTokenSubscription =
    subscribeToPushTokenChanges(
      userId,
    );

  const receivedSubscription =
    Notifications
      .addNotificationReceivedListener(
        () => {
          refreshUnreadCount();
        },
      );

  const responseSubscription =
    Notifications
      .addNotificationResponseReceivedListener(
        (response) => {
          void handleNotificationResponse(
            response,
          );
        },
      );

  const initialResponse =
    Notifications
      .getLastNotificationResponse();

  if (
    initialResponse
      ?.notification
  ) {
    void handleNotificationResponse(
      initialResponse,
    ).finally(() => {
      Notifications
        .clearLastNotificationResponse();
    });
  }

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
     initialRouteName="home"
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
