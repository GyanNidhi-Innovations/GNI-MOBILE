import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/authStore";
import { COLORS } from "@/theme";

export default function TabsLayout() {
  const insets =
    useSafeAreaInsets();

  const unreadCount =
    useAuthStore(
      (state) =>
        state.unreadNotificationCount,
    );

  const safeBottom =
    Math.max(
      insets.bottom,
      12,
    );

  const tabBarHeight =
    68 + safeBottom;

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

        tabBarActiveTintColor:
          COLORS.primary,

        tabBarInactiveTintColor:
          COLORS.textSecondary,

        tabBarStyle: {
          height:
            tabBarHeight,

          backgroundColor:
            COLORS.white,

          borderTopWidth: 0,

          paddingTop: 8,

          paddingBottom:
            safeBottom,

          elevation: 0,

          shadowOpacity: 0,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },

        tabBarBadgeStyle: {
          backgroundColor:
            COLORS.primary,

          color:
            COLORS.white,

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

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "home"
                  : "home-outline"
              }
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

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "today"
                  : "today-outline"
              }
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

          tabBarBadge:
            notificationBadge,

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "notifications"
                  : "notifications-outline"
              }
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

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? "person"
                  : "person-outline"
              }
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
