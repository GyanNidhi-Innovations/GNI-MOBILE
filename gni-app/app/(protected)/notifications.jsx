import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/services/apiClient";
import AppScreen from "@/components/common/AppScreen";
import { COLORS } from "@/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatDateHeading(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function NotificationsScreen() {
  const user = useAuthStore((state) => state.user);

  const setUnreadNotificationCount = useAuthStore(
    (state) => state.setUnreadNotificationCount
  );

  const decrementUnreadNotificationCount = useAuthStore(
    (state) => state.decrementUnreadNotificationCount
  );

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = user?.id || user?._id;
  const insets = useSafeAreaInsets();

  const fetchNotifications = useCallback(async () => {
    try {
      if (!userId) {
        setNotifications([]);
        setUnreadNotificationCount(0);
        return;
      }

      const res = await apiClient(`/notifications/user/${userId}`);
      const fetchedNotifications = res?.notifications || [];

      setNotifications(fetchedNotifications);

      const unreadItems = fetchedNotifications.filter(
        (item) => !item.read
      ).length;

      setUnreadNotificationCount(unreadItems);
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Error",
        error?.message || "Failed to load notifications"
      );
    }
  }, [userId, setUnreadNotificationCount]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    };

    load();
  }, [fetchNotifications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiClient(`/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      let wasUnread = false;

      setNotifications((prev) =>
        prev.map((item) => {
          if (item._id === notificationId && !item.read) {
            wasUnread = true;
            return { ...item, read: true };
          }

          return item;
        })
      );

      if (wasUnread) {
        decrementUnreadNotificationCount();
      }
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Error",
        error?.message || "Failed to mark as read"
      );
    }
  };

  const sectionedNotifications = useMemo(() => {
    const grouped = {};

    notifications.forEach((item) => {
      const key = formatDateHeading(item.createdAt);

      if (!grouped[key]) grouped[key] = [];

      grouped[key].push(item);
    });

    const result = [];

    Object.keys(grouped).forEach((dateKey) => {
      result.push({
        type: "header",
        id: `header-${dateKey}`,
        title: dateKey,
      });

      grouped[dateKey].forEach((item) => {
        result.push({
          type: "notification",
          ...item,
        });
      });
    });

    return result;
  }, [notifications]);

  const renderNotification = ({ item }) => {
    if (item.type === "header") {
      return (
        <Text className="mb-4 mt-2 text-[15px] font-semibold text-[#98A2B3]">
          {item.title}
        </Text>
      );
    }

    return (
      <Pressable
        onPress={() => {
          if (!item.read) {
            handleMarkAsRead(item._id);
          }
        }}
        className={`mb-4 rounded-[28px] p-5 ${
          item.read ? "bg-white" : "bg-[#EEF4FF]"
        }`}
      >
        <View className="flex-row">
          <View
            className={`mr-4 h-12 w-12 items-center justify-center rounded-2xl ${
              item.read ? "bg-[#F2F4F7]" : "bg-[#0F5EFF]"
            }`}
          >
            <Ionicons
              name="notifications"
              size={20}
              color={item.read ? COLORS.textSecondary : COLORS.white}
            />
          </View>

          <View className="flex-1">
            <View className="flex-row items-start justify-between">
              <Text className="mr-3 flex-1 text-[16px] font-semibold leading-6 text-[#101828]">
                {item.title || "Notification"}
              </Text>

              <Text className="text-[12px] text-[#98A2B3]">
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : ""}
              </Text>
            </View>

            <Text className="mt-2 text-[14px] leading-6 text-[#667085]">
              {item.body}
            </Text>

            {!item.read && (
              <View className="mt-4 self-start rounded-full bg-white px-3 py-1">
                <Text className="text-[11px] font-semibold text-[#0F5EFF]">
                  NEW
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <View className="mb-7">
      <Text className="text-[32px] font-bold text-[#101828]">
        Notifications
      </Text>

      <Text className="mt-2 text-[15px] leading-6 text-[#667085]">
        Stay updated with event reminders, registrations, and announcements.
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center px-10 py-24">
      <Ionicons
        name="notifications-off-outline"
        size={48}
        color={COLORS.icon}
      />

      <Text className="mt-5 text-center text-[16px] font-semibold text-[#101828]">
        No notifications yet
      </Text>

      <Text className="mt-2 text-center text-[14px] leading-6 text-[#667085]">
        We'll show event reminders, registrations, and announcements here.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <AppScreen centered scroll={false}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll={false}>
      <FlatList
        data={sectionedNotifications}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        keyExtractor={(item) => item.id || item._id}
        renderItem={renderNotification}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 140 + insets.bottom,
        }}
      />
    </AppScreen>
  );
}