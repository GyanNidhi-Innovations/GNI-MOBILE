import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import NetInfo from "@react-native-community/netinfo";

import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/services/apiClient";
import AppScreen from "@/components/common/AppScreen";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useResponsive } from "@/hooks/useResponsive";
import { COLORS } from "@/theme";

function formatDateHeading(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(
    today.getDate() - 1,
  );

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() ===
      b.getFullYear();

  if (isSameDay(date, today)) {
    return "Today";
  }

  if (isSameDay(date, yesterday)) {
    return "Yesterday";
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
}

export default function NotificationsScreen() {
  const user = useAuthStore(
    (state) => state.user,
  );

  const setUnreadNotificationCount =
    useAuthStore(
      (state) =>
        state.setUnreadNotificationCount,
    );

  const decrementUnreadNotificationCount =
    useAuthStore(
      (state) =>
        state.decrementUnreadNotificationCount,
    );

  const [notifications, setNotifications] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const hasLoadedOnceRef =
    useRef(false);


  const wasOfflineRef =
  useRef(false);

  const userId =
    user?.id || user?._id;

  const insets = useSafeAreaInsets();

  const {
    isCompactPhone,
    type,
    layout,
  } = useResponsive();

  const fetchNotifications =
    useCallback(async () => {
      try {
        if (!userId) {
          setNotifications([]);
          setUnreadNotificationCount(0);
          return;
        }

        const response = await apiClient(
          `/notifications/user/${userId}`,
        );

        const fetchedNotifications =
          response?.notifications || [];

        setNotifications(
          fetchedNotifications,
        );

        const unreadItems =
          fetchedNotifications.filter(
            (item) => !item.read,
          ).length;

        setUnreadNotificationCount(
          unreadItems,
        );
     } catch (error) {
  if (__DEV__) {
    console.warn(
      "fetch notifications error:",
      error?.message || error,
    );
  }

  /*
   * Keep previously loaded alerts.
   * Do not interrupt the user because
   * a background refresh failed.
   */
}
    }, [
      userId,
      setUnreadNotificationCount,
    ]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadNotifications =
        async () => {
          try {
            if (
              !hasLoadedOnceRef.current
            ) {
              setLoading(true);
            }

            await fetchNotifications();

            hasLoadedOnceRef.current =
              true;
          } finally {
            if (active) {
              setLoading(false);
            }
          }
        };

      loadNotifications();

      return () => {
        active = false;
      };
    }, [fetchNotifications]),
  );

 useFocusEffect(
  useCallback(() => {
    let reconnectTimer = null;

    const unsubscribe =
      NetInfo.addEventListener(
        (state) => {
          const isOffline =
            state.isConnected === false ||
            state.isInternetReachable === false;

          if (isOffline) {
            wasOfflineRef.current = true;

            if (reconnectTimer) {
              clearTimeout(
                reconnectTimer,
              );

              reconnectTimer = null;
            }

            return;
          }

          const isOnline =
            state.isConnected === true &&
            state.isInternetReachable !== false;

          if (
            isOnline &&
            wasOfflineRef.current
          ) {
            wasOfflineRef.current = false;

            if (reconnectTimer) {
              clearTimeout(
                reconnectTimer,
              );
            }

            reconnectTimer =
              setTimeout(() => {
                fetchNotifications();
                reconnectTimer = null;
              }, 700);
          }
        },
      );

    return () => {
      unsubscribe();

      if (reconnectTimer) {
        clearTimeout(
          reconnectTimer,
        );
      }

      wasOfflineRef.current = false;
    };
  }, [fetchNotifications]),
);

  useEffect(() => {
    const subscription =
      Notifications.addNotificationReceivedListener(
        () => {
          fetchNotifications();
        },
      );

    return () => {
      subscription.remove();
    };
  }, [fetchNotifications]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (
    notificationId,
  ) => {
    try {
      await apiClient(
        `/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        },
      );

      let wasUnread = false;

      setNotifications((previous) =>
        previous.map((item) => {
          if (
            item._id ===
              notificationId &&
            !item.read
          ) {
            wasUnread = true;

            return {
              ...item,
              read: true,
            };
          }

          return item;
        }),
      );

      if (wasUnread) {
        decrementUnreadNotificationCount();
      }
    } catch (error) {
      if (__DEV__) {
  console.warn(
    "mark notification read error:",
    error?.message || error,
  );
}

      Alert.alert(
        "Unable to update alert",
        error?.message ||
          "Please try again.",
      );
    }
  };

  const handleNotificationPress =
    async (item) => {
      if (!item) return;

      if (!item.read && item._id) {
        await handleMarkAsRead(
          item._id,
        );
      }

      const screen =
        item?.data?.screen ||
        "notifications";

      if (
        screen === "events" &&
        item?.data?.eventId
      ) {
        router.push({
          pathname:
            "/(protected)/events/[id]",
          params: {
            id: String(
              item.data.eventId,
            ),
            source:
              "notification",
          },
        });

        return;
      }

      if (screen === "events") {
        router.push(
          "/(protected)/events",
        );
        return;
      }

      if (screen === "courses") {
        router.push(
          "/(protected)/courses",
        );
        return;
      }

      if (screen === "calendar") {
        router.push(
          "/(protected)/calendar",
        );
        return;
      }

      if (screen === "profile") {
        router.push(
          "/(protected)/profile",
        );
      }
    };

  const sectionedNotifications =
    useMemo(() => {
      const grouped = {};

      notifications.forEach((item) => {
        const key =
          formatDateHeading(
            item.createdAt,
          );

        if (!grouped[key]) {
          grouped[key] = [];
        }

        grouped[key].push(item);
      });

      const result = [];

      Object.keys(grouped).forEach(
        (dateKey) => {
          result.push({
            type: "header",
            id: `header-${dateKey}`,
            title: dateKey,
          });

          grouped[dateKey].forEach(
            (item) => {
              result.push({
                type: "notification",
                ...item,
              });
            },
          );
        },
      );

      return result;
    }, [notifications]);

  const renderNotification = ({
    item,
  }) => {
    if (item.type === "header") {
      return (
        <Text
          style={{
            marginBottom: 12,
            marginTop: 6,
            color: "#98A2B3",
            fontSize: type.small,
            fontWeight: "800",
          }}
        >
          {item.title}
        </Text>
      );
    }

    const eventImageUrl =
      item?.data?.imageUrl ||
      item?.data?.image ||
      "";

    const shouldShowEventImage =
      item?.type === "event" &&
      Boolean(eventImageUrl);

    return (
      <Pressable
        onPress={() =>
          handleNotificationPress(item)
        }
        style={{
          marginBottom: 12,
          borderRadius:
            isCompactPhone ? 20 : 24,
          backgroundColor: item.read
            ? "#FFFFFF"
            : "#EAF0F7",
          padding: layout.cardPadding,
          borderWidth: 1,
          borderColor: item.read
            ? "#EAECF0"
            : "#CAD8E8",
        }}
      >
        <View className="flex-row">
          {shouldShowEventImage ? (
            <Image
              source={{
                uri: eventImageUrl,
              }}
              resizeMode="cover"
              style={{
                width:
                  layout.notificationImageSize,
                height:
                  layout.notificationImageSize,
                marginRight:
                  isCompactPhone
                    ? 12
                    : 16,
                borderRadius:
                  isCompactPhone
                    ? 14
                    : 18,
                backgroundColor:
                  "#F2F4F7",
              }}
            />
          ) : (
            <View
              style={{
                width: isCompactPhone
                  ? 44
                  : 50,
                height: isCompactPhone
                  ? 44
                  : 50,
                marginRight:
                  isCompactPhone
                    ? 12
                    : 16,
                alignItems: "center",
                justifyContent:
                  "center",
                borderRadius: 16,
                backgroundColor:
                  item.read
                    ? "#F2F4F7"
                    : "#001B3D",
              }}
            >
              <Ionicons
                name={
                  item.type === "event"
                    ? "calendar-outline"
                    : "notifications-outline"
                }
                size={
                  isCompactPhone
                    ? 19
                    : 21
                }
                color={
                  item.read
                    ? "#667085"
                    : "#FFFFFF"
                }
              />
            </View>
          )}

          <View className="flex-1">
            <View className="flex-row items-start">
              <Text
                
                style={{
                  flex: 1,
                  marginRight: 8,
                  color: "#101828",
                  fontSize:
                    type.cardTitle,
                  lineHeight:
                    type.cardTitle + 7,
                  fontWeight: "800",
                }}
              >
                {item.title ||
                  "Alert"}
              </Text>

              <Text
                style={{
                  color: "#98A2B3",
                  fontSize:
                    type.small,
                }}
              >
               {item.createdAt
                  ? new Date(
                      item.createdAt,
                    ).toLocaleTimeString(
                      "en-IN",
                      {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      },
                    )
                  : ""}
              </Text>
            </View>

           <Text
  style={{
    marginTop: 7,
    color: "#667085",
    fontSize: type.body,
    lineHeight:
      type.body + 8,
  }}
>
  {item.body}
</Text>

            {item?.data?.screen ===
            "events" ? (
              <View className="mt-3 flex-row items-center">
                <Text
                  style={{
                    color: "#001B3D",
                    fontSize:
                      type.small,
                    fontWeight: "800",
                  }}
                >
                  View event
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color="#001B3D"
                  style={{
                    marginLeft: 3,
                  }}
                />
              </View>
            ) : null}

            {!item.read ? (
              <View className="mt-3 self-start rounded-full bg-white px-3 py-1">
                <Text
                  style={{
                    color: "#001B3D",
                    fontSize: 11,
                    fontWeight: "800",
                  }}
                >
                  NEW
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <ScreenHeader
      title="Alerts"
      subtitle="Important event updates, reminders, registration notices, and account announcements—all in one place."
      style={{
        marginBottom:
          isCompactPhone ? 20 : 26,
      }}
    />
  );

  const renderEmpty = () => (
    <View className="items-center justify-center px-8 py-24">
      <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white">
        <Ionicons
          name="notifications-off-outline"
          size={30}
          color="#667085"
        />
      </View>

      <Text
        style={{
          marginTop: 18,
          textAlign: "center",
          color: "#101828",
          fontSize: type.cardTitle,
          fontWeight: "800",
        }}
      >
        No alerts yet
      </Text>

      <Text
        style={{
          marginTop: 8,
          textAlign: "center",
          color: "#667085",
          fontSize: type.body,
          lineHeight: type.body + 8,
        }}
      >
        Event reminders and important
        announcements will appear here.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <AppScreen
        centered
        scroll={false}
      >
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      scroll={false}
      maxWidth={
        layout.contentMaxWidth
      }
    >
      <FlatList
        data={sectionedNotifications}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        keyExtractor={(item) =>
          String(
            item.id || item._id,
          )
        }
        renderItem={renderNotification}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal:
            layout.horizontalPadding,
          paddingTop: 8,
          paddingBottom:
            140 + insets.bottom,
        }}
      />
    </AppScreen>
  );
}
