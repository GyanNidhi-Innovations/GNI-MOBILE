import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
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

        const res = await apiClient(`/notifications/user/${user.id}`);
        const fetchedNotifications = res?.notifications || [];

        setNotifications(fetchedNotifications);

        const unreadItems = fetchedNotifications.filter(
          (item) => !item.read
        ).length;
        setUnreadNotificationCount(unreadItems);
      } catch (error) {
        console.log("fetchNotifications error:", error);
        Alert.alert("Error", error?.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.id, setUnreadNotificationCount]);

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
      console.log("handleMarkAsRead error:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to mark notification as read"
      );
    }
  };

  const sectionedNotifications = useMemo(() => {
    const grouped = {};

    notifications.forEach((item) => {
      const key = formatDateHeading(item.createdAt);

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

  return (
    <View className="flex-1 bg-gray-100 p-5">
      
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#2563eb" />
        </View>
      ) : notifications.length === 0 ? (
        <Text className="text-gray-500">No notifications yet</Text>
      ) : (
        <FlatList
          data={sectionedNotifications}
          keyExtractor={(item) => item.id || item._id}
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <Text className="text-gray-500 font-semibold mt-2 mb-3">
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
                className={`p-4 rounded-xl mb-3 shadow-sm ${
                  item.read ? "bg-white" : "bg-blue-50"
                }`}
              >
                <View className="flex-row items-start justify-between mb-1">
                  <Text className="text-black font-semibold flex-1 mr-3">
                    {item.title || "Notification"}
                  </Text>

                  <Text className="text-gray-400 text-xs">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : ""}
                  </Text>
                </View>

                <Text className="text-gray-700">{item.body}</Text>

                {!item.read && (
                  <Text className="text-blue-600 text-xs mt-2 font-medium">
                    Tap to mark as read
                  </Text>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}