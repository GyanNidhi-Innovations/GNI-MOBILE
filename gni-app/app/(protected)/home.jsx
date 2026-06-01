import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";

import { router, useFocusEffect } from "expo-router";

import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/services/apiClient";
import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppScreen from "@/components/common/AppScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  COLORS,
  SPACING,
} from "@/theme";

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);

  const userId = user?.id || user?._id;

  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  

  const fetchDashboard = async () => {
    try {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const [eventsRes, unreadRes, notificationsRes] =
        await Promise.all([
          apiClient(`/events/registered/${userId}`),
          apiClient(`/notifications/unread/${userId}`),
          apiClient(`/notifications/user/${userId}`),
        ]);

      setRegisteredEvents(eventsRes?.events || []);

      setUnreadCount(unreadRes?.count || 0);

      setRecentNotifications(
        (notificationsRes?.notifications || []).slice(0, 3)
      );
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Error",
        error?.message || "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useMemo(
      () => () => {
        fetchDashboard();
      },
      [userId]
    )
  );

  const nextEvent = useMemo(() => {
    return registeredEvents
      .filter(
        (event) =>
          event?.date && new Date(event.date) >= new Date()
      )
      .sort(
        (a, b) =>
          new Date(a.date) - new Date(b.date)
      )[0];
  }, [registeredEvents]);

  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <AppScreen centered scroll={false}>
  <ActivityIndicator
    size="small"
    color={COLORS.primary}
  />
</AppScreen>
    );
  }

  return (
  <AppScreen
    contentStyle={{
  paddingTop: 8,
  paddingBottom: 120,
}}
  >
      {/* HEADER */}

      <View className="mb-8 flex-row items-center justify-between">
  <Image
    source={{
      uri: "https://res.cloudinary.com/dwqwtolrt/image/upload/c_limit,w_800,q_75,f_auto/v1760073633/logo_wvim3n.png",
    }}
    className="h-10 w-28"
    resizeMode="contain"
  />

  <View className="items-end">
    <Text className="text-[14px] text-[#667085]">
      Welcome back
    </Text>

    <Text className="mt-1 text-right text-[24px] font-bold text-[#101828]">
      {user?.name || "User"} 👋
    </Text>
  </View>
</View>

      {/* HERO EVENT CARD */}

      <View className="mb-7 overflow-hidden rounded-[28px] bg-[#0F5EFF] p-6">
        <Text className="text-[13px] font-medium text-blue-100">
          Your Next Event
        </Text>

        {nextEvent ? (
          <>
            <Text className="mt-3 text-[26px] font-bold leading-8 text-white">
              {nextEvent.title}
            </Text>

            <View className="mt-5">
              <View className="mb-3 flex-row items-center">
                <Ionicons name="calendar-outline" size={16} color="#DBEAFE" />

                <Text className="ml-2 text-[14px] text-blue-100">
                  {new Date(
                    nextEvent.date
                  ).toLocaleString()}
                </Text>
              </View>

              <Text className="text-[14px] text-blue-100">
                {nextEvent.location || "Online"}
              </Text>
            </View>

            <Pressable
              onPress={() =>
                router.push({
                  pathname:
                    "/(protected)/events/[id]",
                  params: {
                    id: nextEvent._id,
                  },
                })
              }
              className="mt-6 self-start rounded-2xl bg-white px-5 py-3"
            >
              <Text className="font-semibold text-[#0F5EFF]">
                View Event
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text className="mt-3 text-[24px] font-bold text-white">
              No Upcoming Events
            </Text>

            <Text className="mt-3 text-[14px] leading-6 text-blue-100">
              Explore upcoming workshops, internships,
              and opportunities.
            </Text>

            <Pressable
              onPress={() =>
                router.push("/(protected)/events")
              }
              className="mt-6 self-start rounded-2xl bg-white px-5 py-3"
            >
              <Text className="font-semibold text-[#0F5EFF]">
                Explore Events
              </Text>
            </Pressable>
          </>
        )}
      </View>

      {/* STATS */}

      <View className="mb-8 flex-row gap-4">
        <ModernStatCard
          title="Registered"
          value={registeredEvents.length}
        />

        <ModernStatCard
          title="Unread"
          value={unreadCount}
        />
      </View>

      {/* QUICK ACTIONS */}

      <View className="mb-8">
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-[20px] font-bold text-[#101828]">
            Quick Access
          </Text>

<Ionicons name="chevron-forward" size={18} color="#98A2B3" />
        </View>

<View className="flex-row flex-wrap justify-between">
  <QuickActionCard
    title="Events"
    subtitle="Explore events"
    icon={
      <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
    }
    onPress={() => router.push("/(protected)/events")}
  />

  <QuickActionCard
    title="Calendar"
    subtitle="View schedule"
    icon={
      <Ionicons name="today-outline" size={22} color={COLORS.primary} />
    }
    onPress={() => router.push("/(protected)/calendar")}
  />

  <QuickActionCard
    title="Alerts"
    subtitle="Recent updates"
    icon={
      <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
    }
    onPress={() => router.push("/(protected)/notifications")}
  />

  <QuickActionCard
    title="Premises"
    subtitle="Camera validation"
    icon={
      <Ionicons name="camera-outline" size={22} color={COLORS.primary} />
    }
    onPress={() => router.push("/premises")}
  />
</View>
      </View>

      {/* RECENT NOTIFICATIONS */}

      <View>
        <Text className="mb-5 text-[20px] font-bold text-[#101828]">
          Recent Notifications
        </Text>

        {recentNotifications.length === 0 ? (
          <View className="rounded-[24px] bg-white p-6">
            <Text className="text-[#667085]">
              No recent notifications
            </Text>
          </View>
        ) : (
          recentNotifications.map((item, index) => (
            <Pressable
              key={item._id}
              onPress={() =>
                router.push(
                  "/(protected)/notifications"
                )
              }
              className="mb-4 rounded-[24px] bg-white p-5"
            >
              <View className="flex-row items-start justify-between">
                <View className="mr-4 flex-1">
                  <Text className="text-[16px] font-semibold text-[#101828]">
                    {item.title}
                  </Text>

                  <Text className="mt-2 text-[14px] leading-6 text-[#667085]">
                    {item.body}
                  </Text>
                </View>

                <Text className="text-[12px] text-[#98A2B3]">
                  {item.createdAt
                    ? new Date(
                        item.createdAt
                      ).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : ""}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </AppScreen>
  );
}

function ModernStatCard({ title, value }) {
  return (
    <View className="flex-1 rounded-[24px] bg-white p-5">
      <Text className="text-[13px] text-[#667085]">
        {title}
      </Text>

      <Text className="mt-3 text-[30px] font-bold text-[#101828]">
        {value}
      </Text>
    </View>
  );
}

function QuickActionCard({
  title,
  subtitle,
  icon,
  onPress,
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 w-[48%] rounded-[24px] bg-white p-5"
    >
      <View className="mb-5 h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF]">
        {icon}
      </View>

      <Text className="text-[15px] font-semibold text-[#101828]">
        {title}
      </Text>

      <Text className="mt-1 text-[12px] leading-5 text-[#667085]">
        {subtitle}
      </Text>
    </Pressable>
  );
}