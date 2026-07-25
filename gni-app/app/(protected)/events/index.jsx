import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { getEvents } from "@/services/eventService";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useResponsive } from "@/hooks/useResponsive";
import { COLORS } from "@/theme";

function toDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function getEventStart(event) {
  return toDate(
    event?.startAt ||
      event?.date,
  );
}

function getEventEnd(event) {
  return toDate(
    event?.endAt ||
      event?.startAt ||
      event?.date,
  );
}

function formatDate(value) {
  const date = toDate(value);

  if (!date) {
    return "DATE TO BE ANNOUNCED";
  }

  return date
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

function formatTime(value) {
  const date = toDate(value);

  if (!date) {
    return "";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

function EventCard({
  item,
  type,
  isCompactPhone,
}) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  const startAt =
    getEventStart(item);

  const openEvent = () => {
    if (!item?._id) {
      return;
    }

    router.push({
      pathname:
        "/(protected)/events/[id]",

      params: {
        id: String(item._id),
      },
    });
  };

  return (
    <Pressable
      onPress={openEvent}
      style={({ pressed }) => [
        styles.eventCard,

        {
          borderRadius:
            isCompactPhone
              ? 18
              : 22,

          opacity:
            pressed ? 0.92 : 1,
        },
      ]}
    >
      <View
        style={styles.posterFrame}
      >
        {item?.image &&
        !imageFailed ? (
          <Image
            source={{
              uri: item.image,
            }}
            resizeMode="cover"
            onError={(error) => {
              console.log(
                "Event poster error:",
                error?.nativeEvent
                  ?.error,
              );

              setImageFailed(true);
            }}
            style={styles.posterImage}
          />
        ) : (
          <View
            style={styles.imageFallback}
          >
            <Ionicons
              name="image-outline"
              size={40}
              color="#98A2B3"
            />

            <Text
              style={
                styles.imageFallbackText
              }
            >
              Poster unavailable
            </Text>
          </View>
        )}
      </View>

      <View
        style={{
          padding:
            isCompactPhone
              ? 15
              : 18,
        }}
      >
        <View
          style={styles.dateRow}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color="#526B93"
          />

          <Text
            style={{
              marginLeft: 6,

              color: "#526B93",

              fontSize: type.small,

              lineHeight:
                type.small + 5,

              fontWeight: "700",
            }}
          >
            {formatDate(
              item?.startAt ||
                item?.date,
            )}
          </Text>

          {startAt ? (
            <>
              <Text
                style={{
                  marginHorizontal: 7,

                  color: "#98A2B3",

                  fontSize:
                    type.small,
                }}
              >
                •
              </Text>

              <Text
                style={{
                  color: "#526B93",

                  fontSize:
                    type.small,

                  lineHeight:
                    type.small + 5,

                  fontWeight: "700",
                }}
              >
                {formatTime(startAt)}
              </Text>
            </>
          ) : null}
        </View>

        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={{
            marginTop: 10,

            color: "#101828",

            fontSize:
              type.cardTitle,

            lineHeight:
              type.cardTitle + 7,

            fontWeight: "800",
          }}
        >
          {item?.title ||
            "Untitled event"}
        </Text>

        <Text
          numberOfLines={3}
          ellipsizeMode="tail"
          style={{
            marginTop: 8,

            color: "#475467",

            fontSize: type.small,

            lineHeight:
              type.small + 7,
          }}
        >
          {item?.description ||
            "Event information will be updated soon."}
        </Text>

        <View
          style={styles.cardFooter}
        >
          <View
            style={styles.locationRow}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color="#475467"
            />

            <Text
              numberOfLines={1}
              style={{
                flex: 1,

                marginLeft: 7,

                color: "#475467",

                fontSize:
                  type.small,

                fontWeight: "600",
              }}
            >
              {item?.location ||
                "Location to be announced"}
            </Text>
          </View>

          <View
            style={styles.viewButton}
          >
            <Text
              style={{
                color: "#001B3D",

                fontSize:
                  type.small,

                fontWeight: "800",
              }}
            >
              View
            </Text>

            <Ionicons
              name="arrow-forward"
              size={16}
              color="#001B3D"
              style={{
                marginLeft: 6,
              }}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function EventsScreen() {
  const [
    activeTab,
    setActiveTab,
  ] = useState("upcoming");

  const [events, setEvents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const loadedOnceRef =
    useRef(false);

  const insets =
    useSafeAreaInsets();

  const {
    isCompactPhone,
    type,
    layout,
  } = useResponsive();

  const fetchEvents =
    useCallback(
      async ({
        initial = false,
      } = {}) => {
        try {
          if (
            initial &&
            !loadedOnceRef.current
          ) {
            setLoading(true);
          }

          const response =
            await getEvents();

          setEvents(
            Array.isArray(
              response?.events,
            )
              ? response.events
              : [],
          );

          loadedOnceRef.current =
            true;
        } catch (error) {
          console.log(
            "fetchEvents error:",
            error,
          );

          Alert.alert(
            "Unable to load events",
            error?.message ||
              "Please try again.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useFocusEffect(
    useCallback(() => {
      fetchEvents({
        initial: true,
      });
    }, [fetchEvents]),
  );

  const handleRefresh =
    useCallback(async () => {
      try {
        setRefreshing(true);

        await fetchEvents();
      } finally {
        setRefreshing(false);
      }
    }, [fetchEvents]);

  const visibleEvents =
    useMemo(() => {
      const now = new Date();

      const availableEvents =
        events.filter(
          (event) =>
            event?.status !==
              "draft" &&
            event?.status !==
              "cancelled",
        );

      const upcomingEvents =
        availableEvents
          .filter((event) => {
            const end =
              getEventEnd(event);

            return (
              !end ||
              end >= now
            );
          })
          .sort((first, second) => {
  const firstCreatedAt =
    toDate(first?.createdAt)
      ?.getTime() ?? 0;

  const secondCreatedAt =
    toDate(second?.createdAt)
      ?.getTime() ?? 0;

  return (
    secondCreatedAt -
    firstCreatedAt
  );
});

      const pastEvents =
        availableEvents
          .filter((event) => {
            const end =
              getEventEnd(event);

            return Boolean(
              end &&
                end < now,
            );
          })
          .sort((first, second) => {
            const firstDate =
              getEventStart(first)
                ?.getTime() ?? 0;

            const secondDate =
              getEventStart(second)
                ?.getTime() ?? 0;

            return (
              secondDate -
              firstDate
            );
          });

      return activeTab ===
        "upcoming"
        ? upcomingEvents
        : pastEvents;
    }, [
      activeTab,
      events,
    ]);

  const renderEvent =
    useCallback(
      ({ item }) => (
        <EventCard
          item={item}
          type={type}
          isCompactPhone={
            isCompactPhone
          }
        />
      ),
      [
        isCompactPhone,
        type,
      ],
    );

  const listHeader = (
    <View
      style={
        styles.headerContainer
      }
    >
      <ScreenHeader
        title="Events"
        subtitle="Explore workshops, webinars, hiring drives, internships, and industry opportunities."
      />

      <View style={styles.tabsRow}>
  {/* Upcoming button */}
  <View
    style={{
      flex: 1,
      height: 50,
      marginRight: 6,
      overflow: "hidden",
      borderRadius: 14,

      backgroundColor:
        activeTab === "upcoming"
          ? "#022670"
          : "#FFFFFF",

      borderWidth: 1.5,

      borderColor:
        activeTab === "upcoming"
          ? "#022670"
          : "#B8C2D1",
    }}
  >
    <Pressable
      onPress={() =>
        setActiveTab("upcoming")
      }
      style={({ pressed }) => ({
        width: "100%",
        height: "100%",

        alignItems: "center",
        justifyContent: "center",

        opacity:
          pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          width: "100%",
          height: 50,
          lineHeight: 50,

          color:
            activeTab === "upcoming"
              ? "#FFFFFF"
              : "#344054",

          fontSize: type.body,
          fontWeight: "800",

          textAlign: "center",
          textAlignVertical: "center",

          includeFontPadding: false,
        }}
      >
        Upcoming
      </Text>
    </Pressable>
  </View>

  {/* Past button */}
  <View
    style={{
      flex: 1,
      height: 50,
      marginLeft: 6,
      overflow: "hidden",
      borderRadius: 14,

      backgroundColor:
        activeTab === "past"
          ? "#022670"
          : "#FFFFFF",

      borderWidth: 1.5,

      borderColor:
        activeTab === "past"
          ? "#022670"
          : "#B8C2D1",
    }}
  >
    <Pressable
      onPress={() =>
        setActiveTab("past")
      }
      style={({ pressed }) => ({
        width: "100%",
        height: "100%",

        alignItems: "center",
        justifyContent: "center",

        opacity:
          pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          width: "100%",
          height: 50,
          lineHeight: 50,

          color:
            activeTab === "past"
              ? "#FFFFFF"
              : "#344054",

          fontSize: type.body,
          fontWeight: "800",

          textAlign: "center",
          textAlignVertical: "center",

          includeFontPadding: false,
        }}
      >
        Past
      </Text>
    </Pressable>
  </View>
</View>
    </View>
  );

  if (
    loading &&
    !loadedOnceRef.current
  ) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={styles.safeArea}
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={styles.safeArea}
    >
      <FlatList
        style={styles.list}
        data={visibleEvents}
        keyExtractor={(item) =>
          String(item._id)
        }
        renderItem={renderEvent}
        ItemSeparatorComponent={() => (
  <View
    style={{
      height: 32,
    }}
  />
)}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          listHeader
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          flexGrow: 1,

          width: "100%",

          maxWidth:
            layout.contentMaxWidth,

          alignSelf: "center",

          paddingTop: 8,

          paddingBottom:
            100 + insets.bottom,
        }}
        ListEmptyComponent={
          <View
            style={
              styles.emptyContainer
            }
          >
            <Ionicons
              name="calendar-clear-outline"
              size={44}
              color="#667085"
            />

            <Text
              style={{
                marginTop: 16,

                color: "#101828",

                fontSize:
                  type.sectionTitle,

                fontWeight: "800",

                textAlign: "center",
              }}
            >
              {activeTab ===
              "upcoming"
                ? "No upcoming events"
                : "No past events"}
            </Text>

            <Text
              style={{
                marginTop: 8,

                color: "#667085",

                fontSize:
                  type.body,

                lineHeight:
                  type.body + 8,

                textAlign: "center",
              }}
            >
              {activeTab ===
              "upcoming"
                ? "New events will appear here when they are published."
                : "Completed events will appear here for reference."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
 safeArea: {
  flex: 1,
  backgroundColor: "#FFFFFF",
},

  list: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent:
      "center",
  },

  headerContainer: {
    paddingHorizontal: 16,
  },

  tabsRow: {
    flexDirection: "row",

    marginBottom: 22,
  },

  eventCard: {
  marginHorizontal: 14,

  /*
   * Strong visible gap between
   * one event and the next.
   */
  marginBottom: 28,

  overflow: "hidden",

  borderWidth: 1.5,
  borderColor: "#C7D0DD",

  backgroundColor: "#FFFFFF",

  elevation: 4,

  shadowColor: "#101828",

  shadowOffset: {
    width: 0,
    height: 3,
  },

  shadowOpacity: 0.12,
  shadowRadius: 9,
},

  posterFrame: {
    width: "100%",

    aspectRatio: 16 / 9,

    overflow: "hidden",

    backgroundColor:
      "#E9EDF3",
  },

  posterImage: {
    width: "100%",

    height: "100%",
  },

  imageFallback: {
    flex: 1,

    alignItems: "center",

    justifyContent:
      "center",
  },

  imageFallbackText: {
    marginTop: 8,

    color: "#667085",

    fontSize: 12,

    fontWeight: "600",
  },

  dateRow: {
    flexDirection: "row",

    alignItems: "center",

    flexWrap: "wrap",
  },

  cardFooter: {
    marginTop: 17,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",
  },

  locationRow: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    marginRight: 12,
  },

  viewButton: {
    minHeight: 38,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "center",

    borderRadius: 11,

    backgroundColor:
      "#EEF4FF",

    paddingHorizontal: 13,
  },

  emptyContainer: {
    flex: 1,

    minHeight: 320,

    alignItems: "center",

    justifyContent:
      "center",

    paddingHorizontal: 28,
  },
});