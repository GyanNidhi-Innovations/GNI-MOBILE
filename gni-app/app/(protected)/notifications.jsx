import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!user?.id) {
          setLoading(false);
          return;
        }

        const res = await apiClient(
          `/notifications/user/${user.id}`
        );

        const fetchedNotifications =
          res?.notifications || [];

        setNotifications(fetchedNotifications);

        const unreadItems =
          fetchedNotifications.filter(
            (item) => !item.read
          ).length;

        setUnreadNotificationCount(unreadItems);
      } catch (error) {
        console.log(error);

        Alert.alert(
          "Error",
          error?.message ||
            "Failed to load notifications"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  const handleMarkAsRead = async (
    notificationId
  ) => {
    try {
      await apiClient(
        `/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        }
      );

      let wasUnread = false;

      setNotifications((prev) =>
        prev.map((item) => {
          if (
            item._id === notificationId &&
            !item.read
          ) {
            wasUnread = true;

            return {
              ...item,
              read: true,
            };
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
        error?.message ||
          "Failed to mark as read"
      );
    }
  };

  const sectionedNotifications = useMemo(() => {
    const grouped = {};

    notifications.forEach((item) => {
      const key = formatDateHeading(
        item.createdAt
      );

      if (!grouped[key]) {
        grouped[key] = [];
      }

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
          item.read
            ? "bg-white"
            : "bg-[#EEF4FF]"
        }`}
      >
        <View className="flex-row">
          {/* ICON */}

          <View
            className={`mr-4 h-12 w-12 items-center justify-center rounded-2xl ${
              item.read
                ? "bg-[#F2F4F7]"
                : "bg-[#0F5EFF]"
            }`}
          >
            <Ionicons
              name="notifications"
              size={20}
              color={
                item.read ? "#667085" : "#FFFFFF"
              }
            />
          </View>

          {/* CONTENT */}

          <View className="flex-1">
            <View className="flex-row items-start justify-between">
              <Text className="mr-3 flex-1 text-[16px] font-semibold leading-6 text-[#101828]">
                {item.title || "Notification"}
              </Text>

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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F6F8FB]">
        <ActivityIndicator
          size="small"
          color="#0F5EFF"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F6F8FB]">
      {/* HEADER */}

      <View className="px-5 pt-6">
        <Text className="text-[32px] font-bold text-[#101828]">
          Notifications
        </Text>

        <Text className="mt-2 text-[15px] leading-6 text-[#667085]">
          Stay updated with event reminders,
          registrations, and announcements.
        </Text>
      </View>

      {/* CONTENT */}

      {notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons
            name="notifications-off-outline"
            size={48}
            color="#98A2B3"
          />

          <Text className="mt-5 text-center text-[16px] text-[#667085]">
            No notifications yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={sectionedNotifications}
          keyExtractor={(item) =>
            item.id || item._id
          }
          renderItem={renderNotification}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 120,
          }}
        />
      )}
    </View>
  );
}