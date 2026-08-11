import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  router,
  useFocusEffect,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";

import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/services/apiClient";
import AppScreen from "@/components/common/AppScreen";
import { useResponsive } from "@/hooks/useResponsive";
import { COLORS } from "@/theme";

export default function HomeScreen() {
  const user = useAuthStore(
    (state) => state.user,
  );

  const {
    isCompactPhone,
    type,
    layout,
  } = useResponsive();

  const userId =
    user?.id || user?._id;

  const [
  events,
  setEvents,
] = useState([]);
  const [unreadCount, setUnreadCount] =
    useState(0);
  const [recentNotifications, setRecentNotifications] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const hasLoadedOnceRef =
    useRef(false);

  const wasOfflineRef =
  useRef(false);

  const fetchDashboard = useCallback(
    async () => {
      try {
        if (!userId) {
          setLoading(false);
          hasLoadedOnceRef.current = true;
          return;
        }

        if (!hasLoadedOnceRef.current) {
          setLoading(true);
        }

        const [
          eventsResponse,
          unreadResponse,
          notificationsResponse,
        ] = await Promise.all([
          apiClient(
            "/events",
          ),
          apiClient(
            `/notifications/unread/${userId}`,
          ),
          apiClient(
            `/notifications/user/${userId}`,
          ),
        ]);

       setEvents(
        eventsResponse?.events || [],
      );

        setUnreadCount(
          unreadResponse?.count || 0,
        );

        setRecentNotifications(
          (
            notificationsResponse?.notifications ||
            []
          ).slice(0, 3),
        );
      } catch (error) {
        if (__DEV__) {
  console.warn(
    "fetchDashboard error:",
    error?.message || error,
  );
}

        Alert.alert(
          "Unable to refresh Home",
          error?.message ||
            "Please try again.",
        );
      } finally {
        setLoading(false);
        hasLoadedOnceRef.current = true;
      }
    },
    [userId],
  );

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard]),
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
                fetchDashboard();
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
  }, [fetchDashboard]),
);

  const nextEvent = useMemo(() => {
    const now = new Date();

    return events
      .filter((event) => {
        const value =
  event?.startAt ||
  event?.date;

if (!value) return false;

const date =
  new Date(value);

        return (
          !Number.isNaN(
            date.getTime(),
          ) && date >= now
        );
      })
      .sort(
        (a, b) =>
          new Date(
  a.startAt || a.date,
) -
new Date(
  b.startAt || b.date,
)
      )[0];
  }, [events]);

  if (
    loading &&
    !hasLoadedOnceRef.current
  ) {
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
      refreshing={refreshing}
      onRefresh={handleRefresh}
      maxWidth={
        layout.contentMaxWidth
      }
      bottomSpace={30}
      contentStyle={{
        paddingHorizontal:
          layout.horizontalPadding,
        paddingTop: 10,
      }}
    >
      <View
        style={{
          marginBottom:
            isCompactPhone ? 22 : 28,
        }}
      >
        <Text
          style={{
            color: "#667085",
            fontSize: type.small,
            fontWeight: "600",
          }}
        >
          Welcome back
        </Text>

        <Text
          numberOfLines={2}
          style={{
            marginTop: 5,
            color: "#101828",
            fontSize: type.pageTitle,
            lineHeight:
              type.pageTitle + 7,
            fontWeight: "800",
          }}
        >
          {user?.name || "User"} 👋
        </Text>

        <Text
          style={{
            marginTop: 8,
            color: "#667085",
            fontSize: type.body,
            lineHeight:
              type.body + 8,
          }}
        >
          Your events and important updates
          are collected here.
        </Text>
      </View>

      

      <View className="mb-7 flex-row">
        <StatCard
          title="Total Events"
          value={
            events.length
          }
          type={type}
          compact={isCompactPhone}
        />

        <View
          style={{
            width:
              isCompactPhone ? 10 : 14,
          }}
        />

        <StatCard
          title="Unread Alerts"
          value={unreadCount}
          type={type}
          compact={isCompactPhone}
        />
      </View>

      <View>
        <View className="mb-4 flex-row items-center justify-between">
          <Text
            style={{
              color: "#101828",
              fontSize:
                type.sectionTitle,
              fontWeight: "800",
            }}
          >
            Recent Alerts
          </Text>

          <Pressable
            onPress={() =>
              router.push(
                "/(protected)/notifications",
              )
            }
            hitSlop={10}
          >
            <Text
              style={{
                color: "#001B3D",
                fontSize: type.small,
                fontWeight: "800",
              }}
            >
              View all
            </Text>
          </Pressable>
        </View>

        {recentNotifications.length ===
        0 ? (
          <View
            style={{
              borderRadius: 22,
              backgroundColor: "#FFFFFF",
              padding: layout.cardPadding,
            }}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF0F7]">
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#001B3D"
              />
            </View>

            <Text
              style={{
                marginTop: 14,
                color: "#101828",
                fontSize:
                  type.cardTitle,
                fontWeight: "800",
              }}
            >
              No recent alerts
            </Text>

            <Text
              style={{
                marginTop: 6,
                color: "#667085",
                fontSize: type.body,
                lineHeight:
                  type.body + 8,
              }}
            >
              Important updates will appear
              here.
            </Text>
          </View>
        ) : (
          recentNotifications.map(
            (item) => (
              <Pressable
                key={String(item._id)}
                onPress={() =>
                  router.push(
                    "/(protected)/notifications",
                  )
                }
                style={{
                  marginBottom: 12,
                  borderRadius: 22,
                  backgroundColor:
                    item.read
                      ? "#FFFFFF"
                      : "#EAF0F7",
                  padding:
                    layout.cardPadding,
                  borderWidth: 1,
                  borderColor: "#EAECF0",
                }}
              >
                <View className="flex-row items-start">
                  <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-white">
                    <Ionicons
                      name="notifications-outline"
                      size={20}
                      color="#001B3D"
                    />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-start">
                      <Text
                        numberOfLines={2}
                        style={{
                          flex: 1,
                          marginRight: 10,
                          color: "#101828",
                          fontSize:
                            type.cardTitle,
                          lineHeight:
                            type.cardTitle +
                            7,
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
                              [],
                              {
                                hour:
                                  "numeric",
                                minute:
                                  "2-digit",
                              },
                            )
                          : ""}
                      </Text>
                    </View>

                    <Text
                      numberOfLines={
                        isCompactPhone
                          ? 2
                          : 3
                      }
                      style={{
                        marginTop: 7,
                        color: "#667085",
                        fontSize:
                          type.body,
                        lineHeight:
                          type.body + 8,
                      }}
                    >
                      {item.body}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ),
          )
        )}
      </View>
    </AppScreen>
  );
}

function HomeMeta({
  icon,
  text,
  fontSize,
}) {
  return (
    <View className="mb-3 flex-row items-center">
      <Ionicons
        name={icon}
        size={17}
        color="#D7E4F2"
      />

      <Text
        numberOfLines={2}
        style={{
          flex: 1,
          marginLeft: 8,
          color: "#D7E4F2",
          fontSize,
          lineHeight: fontSize + 6,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function StatCard({
  title,
  value,
  type,
  compact,
}) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: compact
          ? 104
          : 116,
        justifyContent: "center",
        borderRadius:
          compact ? 20 : 24,
        backgroundColor: "#FFFFFF",
        padding: compact ? 16 : 20,
        borderWidth: 1,
        borderColor: "#EAECF0",
      }}
    >
      <Text
        style={{
          color: "#667085",
          fontSize: type.small,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          marginTop: 8,
          color: "#101828",
          fontSize:
            compact ? 26 : 30,
          fontWeight: "800",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
