import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/services/apiClient";
import { Image } from "react-native";

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

      const [eventsRes, unreadRes, notificationsRes] = await Promise.all([
        apiClient(`/events/registered/${userId}`),
        apiClient(`/notifications/unread/${userId}`),
        apiClient(`/notifications/user/${userId}`),
      ]);

      setRegisteredEvents(eventsRes?.events || []);
      setUnreadCount(unreadRes?.count || 0);
      setRecentNotifications((notificationsRes?.notifications || []).slice(0, 2));
    } catch (error) {
      console.log("fetchDashboard error:", error);
      Alert.alert("Error", error?.message || "Failed to load dashboard");
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
      .filter((event) => event?.date && new Date(event.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  }, [registeredEvents]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <ActivityIndicator size="small" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100" contentContainerStyle={{ padding: 20 }}>
      <View className="mb-6">
        <Image
  source={{
    uri: "https://res.cloudinary.com/dwqwtolrt/image/upload/c_limit,w_800,q_75,f_auto/v1760073633/logo_wvim3n.png",
  }}
  className="w-40 h-12 mb-2"
  resizeMode="contain"
/>
        <Text className="mt-1 text-xl text-gray-600">
          Welcome back, {user?.name || "User"}
        </Text>
      </View>

      <View className="bg-blue-900 rounded-3xl p-5 mb-5">
        <Text className="text-blue-100 text-sm font-medium mb-2">
          Your Next Event
        </Text>

        {nextEvent ? (
          <>
            <Text className="text-white text-xl font-bold mb-2">
              {nextEvent.title}
            </Text>

            <Text className="text-blue-100 text-sm mb-1">
              📅 {new Date(nextEvent.date).toLocaleString()}
            </Text>

            <Text className="text-blue-100 text-sm mb-4">
              📍 {nextEvent.location || "-"}
            </Text>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(protected)/events/[id]",
                  params: {
                    id: nextEvent._id,
                    source: "home",
                  },
                })
              }
              className="bg-blue-600 px-4 py-3 rounded-xl self-start"
            >
              <Text className="text-white font-semibold">View Event</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text className="text-white text-lg font-semibold mb-2">
              No upcoming events
            </Text>
            <Text className="text-blue-100 text-sm mb-4">
              Explore events and register for your next opportunity.
            </Text>

            <Pressable
              onPress={() => router.push("/(protected)/events")}
              className="bg-blue-600 px-4 py-3 rounded-xl self-start"
            >
              <Text className="text-white font-semibold">Explore Events</Text>
            </Pressable>
          </>
        )}
      </View>

      <View className="flex-row gap-3 mb-5">
        <StatCard title="My Events" value={registeredEvents.length} />
        <StatCard title="Unread" value={unreadCount} />
      </View>

      <View className="bg-white rounded-2xl p-5 mb-5">
        <Text className="text-lg font-bold text-blue-900 mb-4">
          Quick Actions
        </Text>

        <Pressable
          onPress={() => router.push("/(protected)/events")}
          className="bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-100"
        >
          <Text className="text-lg font-semibold text-gray-900">📅 Events</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Explore and register for events
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(protected)/calendar")}
          className="bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-100"
        >
          <Text className="text-lg font-semibold text-gray-900">📆 Calendar</Text>
          <Text className="text-sm text-gray-500 mt-1">
            View your scheduled events
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(protected)/notifications")}
          className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
        >
          <Text className="text-lg font-semibold text-gray-900">🔔 Notifications</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Check your latest updates
          </Text>
        </Pressable>
      </View>

      <View className="bg-white rounded-2xl p-5 mb-5">
        <Text className="text-lg font-bold text-blue-900 mb-4">
          Recent Notifications
        </Text>

        {recentNotifications.length === 0 ? (
          <Text className="text-sm text-gray-500">No recent notifications</Text>
        ) : (
          recentNotifications.map((item, index) => (
            <View key={item._id}>
              <Pressable
                onPress={() => router.push("/(protected)/notifications")}
                className="py-1"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-semibold text-gray-900">
                      {item.title || "Notification"}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      {item.body || ""}
                    </Text>
                  </View>

                  <Text className="text-xs text-gray-400">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : ""}
                  </Text>
                </View>
              </Pressable>

              {index !== recentNotifications.length - 1 && (
                <View className="h-px bg-gray-200 my-4" />
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ title, value }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 items-center justify-center">
      <Text className="text-xs text-gray-500 mb-1">{title}</Text>
      <Text className="text-2xl font-bold text-blue-900">{value}</Text>
    </View>
  );
}