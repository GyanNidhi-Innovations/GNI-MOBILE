import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
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


function formatEventDate(value) {
  const date = toDate(value);

  if (!date) {
    return "DATE TO BE ANNOUNCED";
  }

  return date
    .toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    )
    .toUpperCase();
}


function formatFullEventDate(value) {
  const date = toDate(value);

  if (!date) {
    return "Date to be announced";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}


function formatEventTime(value) {
  const date = toDate(value);

  if (!date) {
    return "";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    },
  );
}


function formatNotificationTime(value) {
  const date = toDate(value);

  if (!date) {
    return "";
  }

  const now = new Date();

  const sameDay =
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth() &&
    date.getDate() ===
      now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      },
    );
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    },
  );
}


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
    user?.id ||
    user?._id;

  const [
    events,
    setEvents,
  ] = useState([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    recentNotifications,
    setRecentNotifications,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    loadError,
    setLoadError,
  ] = useState(null);


  const hasLoadedOnceRef =
    useRef(false);

  const hasSuccessfulLoadRef =
    useRef(false);

  const wasOfflineRef =
    useRef(false);


  /*
   * Recently Completed cards should
   * leave part of the next card visible.
   */
  const recentCardWidth =
  isCompactPhone
    ? 175
    : 195;


  const fetchDashboard =
    useCallback(
      async () => {
        if (!userId) {
          setLoading(false);

          hasLoadedOnceRef.current =
            true;

          return false;
        }

        try {
          if (
            !hasLoadedOnceRef.current
          ) {
            setLoading(true);
          }

          const [
            eventsResponse,
            unreadResponse,
            notificationsResponse,
          ] =
            await Promise.all([
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


          const fetchedEvents =
            Array.isArray(
              eventsResponse?.events,
            )
              ? eventsResponse.events
              : [];


          const fetchedNotifications =
            Array.isArray(
              notificationsResponse
                ?.notifications,
            )
              ? notificationsResponse
                  .notifications
              : [];


          setEvents(
            fetchedEvents,
          );


          setUnreadCount(
            unreadResponse?.count ||
              0,
          );


          setRecentNotifications(
            fetchedNotifications.slice(
              0,
              3,
            ),
          );


          setLoadError(null);

          hasSuccessfulLoadRef.current =
            true;

          return true;
        } catch (error) {
          if (__DEV__) {
            console.warn(
              "fetchDashboard error:",
              error?.message ||
                error,
            );
          }


          /*
           * If Home already loaded once,
           * keep that useful information
           * visible.
           */
          if (
            hasSuccessfulLoadRef.current
          ) {
            return false;
          }


          try {
            const networkState =
              await NetInfo.fetch();

            const offline =
              networkState
                .isConnected ===
                  false ||
              networkState
                .isInternetReachable ===
                  false;

            setLoadError(
              offline
                ? "offline"
                : "error",
            );
          } catch {
            setLoadError(
              "error",
            );
          }

          return false;
        } finally {
          setLoading(false);

          hasLoadedOnceRef.current =
            true;
        }
      },
      [userId],
    );


  const handleRefresh =
    useCallback(
      async () => {
        try {
          setRefreshing(true);

          await fetchDashboard();
        } finally {
          setRefreshing(false);
        }
      },
      [fetchDashboard],
    );


  /*
   * Refresh whenever Home becomes
   * active again.
   */
  useFocusEffect(
    useCallback(() => {
      void fetchDashboard();
    }, [fetchDashboard]),
  );


  /*
   * Reconnect behaviour.
   *
   * Keep old data while offline.
   * Refresh silently when internet
   * returns.
   */
  useFocusEffect(
    useCallback(() => {
      let reconnectTimer =
        null;

      let retryTimer =
        null;


      const unsubscribe =
        NetInfo.addEventListener(
          (state) => {
            const offline =
              state.isConnected ===
                false ||
              state
                .isInternetReachable ===
                false;


            if (offline) {
              wasOfflineRef.current =
                true;


              if (
                reconnectTimer
              ) {
                clearTimeout(
                  reconnectTimer,
                );

                reconnectTimer =
                  null;
              }


              if (retryTimer) {
                clearTimeout(
                  retryTimer,
                );

                retryTimer =
                  null;
              }

              return;
            }


            const online =
              state.isConnected ===
                true &&
              state
                .isInternetReachable !==
                false;


            if (
              online &&
              wasOfflineRef.current
            ) {
              wasOfflineRef.current =
                false;


              reconnectTimer =
                setTimeout(
                  async () => {
                    const success =
                      await fetchDashboard();

                    reconnectTimer =
                      null;


                    if (!success) {
                      retryTimer =
                        setTimeout(
                          () => {
                            void fetchDashboard();

                            retryTimer =
                              null;
                          },
                          1500,
                        );
                    }
                  },
                  700,
                );
            }
          },
        );


      return () => {
        unsubscribe();


        if (
          reconnectTimer
        ) {
          clearTimeout(
            reconnectTimer,
          );
        }


        if (retryTimer) {
          clearTimeout(
            retryTimer,
          );
        }


        wasOfflineRef.current =
          false;
      };
    }, [fetchDashboard]),
  );


  /*
   * Categorise events exactly once.
   *
   * An event remains Upcoming until
   * its end time has passed.
   */
  const categorizedEvents =
    useMemo(() => {
      const now =
        new Date();


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
          .filter(
            (event) => {
              const end =
                getEventEnd(
                  event,
                );

              return (
                !end ||
                end >= now
              );
            },
          )
          .sort(
            (
              first,
              second,
            ) => {
              const firstTime =
                getEventStart(
                  first,
                )?.getTime() ??
                Number.MAX_SAFE_INTEGER;

              const secondTime =
                getEventStart(
                  second,
                )?.getTime() ??
                Number.MAX_SAFE_INTEGER;

              return (
                firstTime -
                secondTime
              );
            },
          );


      const pastEvents =
        availableEvents
          .filter(
            (event) => {
              const end =
                getEventEnd(
                  event,
                );

              return Boolean(
                end &&
                  end < now,
              );
            },
          )
          .sort(
            (
              first,
              second,
            ) => {
              const firstTime =
                getEventStart(
                  first,
                )?.getTime() ??
                0;

              const secondTime =
                getEventStart(
                  second,
                )?.getTime() ??
                0;

              return (
                secondTime -
                firstTime
              );
            },
          );


      return {
        totalEvents:
          availableEvents.length,

        upcomingEvents,

        pastEvents,
      };
    }, [events]);


  const totalEvents =
    categorizedEvents
      .totalEvents;


  const upcomingEvents =
    categorizedEvents
      .upcomingEvents;


  const pastEvents =
    categorizedEvents
      .pastEvents;


  const nextEvent =
    upcomingEvents[0] ||
    null;


  /*
   * Home only previews the latest
   * three completed events.
   */
  const recentPastEvents =
    pastEvents.slice(
      0,
      3,
    );


  const openEvent =
    useCallback(
      (event) => {
        if (!event?._id) {
          return;
        }


        router.navigate({
          pathname:
            "/event/[id]",

          params: {
            id:
              String(
                event._id,
              ),
          },
        });
      },
      [],
    );


 const openEvents =
  useCallback(() => {
    router.navigate({
      pathname: "/events",
      params: {
        tab: "upcoming",
      },
    });
  }, []);

  const openPastEvents =
    useCallback(() => {
      router.navigate({
        pathname:
          "/events",

        params: {
          tab: "past",
        },
      });
    }, []);


  const openAlerts =
    useCallback(() => {
      router.navigate(
        "/notifications",
      );
    }, []);


  /*
   * First load only.
   */
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
          color={
            COLORS.primary
          }
        />
      </AppScreen>
    );
  }


  /*
   * Only block the screen when Home
   * has never successfully loaded.
   */
  if (
    loadError &&
    !hasSuccessfulLoadRef.current
  ) {
    const offline =
      loadError ===
      "offline";


    return (
      <AppScreen
        centered
        scroll={false}
      >
        <View
          style={{
            width: 72,
            height: 72,

            alignItems:
              "center",

            justifyContent:
              "center",

            borderRadius: 24,

            backgroundColor:
              "#F2F4F7",
          }}
        >
          <Ionicons
            name={
              offline
                ? "cloud-offline-outline"
                : "alert-circle-outline"
            }
            size={36}
            color="#667085"
          />
        </View>


        <Text
          style={{
            marginTop: 20,

            color: "#101828",

            fontSize:
              type.sectionTitle,

            fontWeight:
              "800",

            textAlign:
              "center",
          }}
        >
          {offline
            ? "No internet connection"
            : "Unable to load Home"}
        </Text>


        <Text
          style={{
            maxWidth: 310,

            marginTop: 8,

            color: "#667085",

            fontSize:
              type.body,

            lineHeight:
              type.body + 8,

            textAlign:
              "center",
          }}
        >
          {offline
            ? "Reconnect to the internet and try again."
            : "We couldn't load your dashboard right now."}
        </Text>


        <Pressable
          onPress={() => {
            void fetchDashboard();
          }}
          style={({
            pressed,
          }) => ({
            minHeight: 48,

            marginTop: 22,

            alignItems:
              "center",

            justifyContent:
              "center",

            borderRadius: 14,

            backgroundColor:
              "#022670",

            paddingHorizontal:
              24,

            opacity:
              pressed
                ? 0.82
                : 1,
          })}
        >
          <Text
            style={{
              color:
                "#FFFFFF",

              fontSize:
                type.button,

              fontWeight:
                "700",
            }}
          >
            Try Again
          </Text>
        </Pressable>
      </AppScreen>
    );
  }


  return (
    <AppScreen
      refreshing={
        refreshing
      }
      onRefresh={
        handleRefresh
      }
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
      {/*
       * =========================================
       * WELCOME
       * =========================================
       */}

      <View
        style={{
          marginBottom:
            isCompactPhone
              ? 22
              : 28,
        }}
      >
        <Text
          style={{
            color: "#667085",

            fontSize:
              type.small,

            fontWeight:
              "600",
          }}
        >
          Welcome back
        </Text>


        <Text
          numberOfLines={2}
          style={{
            marginTop: 5,

            color: "#101828",

            fontSize:
              type.pageTitle,

            lineHeight:
              type.pageTitle +
              7,

            fontWeight:
              "800",
          }}
        >
          {user?.name ||
            "User"}{" "}
          👋
        </Text>


        <Text
          style={{
            marginTop: 8,

            color: "#667085",

            fontSize:
              type.body,

            lineHeight:
              type.body + 8,
          }}
        >
          Your events,
          opportunities and
          important updates are
          collected here.
        </Text>
      </View>


      {/*
       * =========================================
       * SUMMARY
       * =========================================
       */}

      <View
        style={{
          flexDirection:
            "row",

          marginBottom:
            isCompactPhone
              ? 28
              : 32,
        }}
      >
        <StatCard
          title="Total Events"
          value={
            totalEvents
          }
          icon="calendar-outline"
          type={type}
          compact={
            isCompactPhone
          }
        />


        <View
          style={{
            width:
              isCompactPhone
                ? 10
                : 14,
          }}
        />


        <StatCard
          title="Unread Alerts"
          value={
            unreadCount
          }
          icon="notifications-outline"
          type={type}
          compact={
            isCompactPhone
          }
        />
      </View>


      {/*
       * =========================================
       * UP NEXT
       * =========================================
       */}

      <View
        style={{
          marginBottom:
            isCompactPhone
              ? 30
              : 34,
        }}
      >
        <SectionHeader
          title="Up Next"
          actionLabel={
            nextEvent
              ? "View all"
              : null
          }
          onAction={
            nextEvent
              ? openEvents
              : null
          }
          type={type}
        />


        {nextEvent ? (
          <FeaturedEventCard
            key={String(
              nextEvent._id,
            )}
            event={
              nextEvent
            }
            onPress={() =>
              openEvent(
                nextEvent,
              )
            }
            type={type}
            isCompactPhone={
              isCompactPhone
            }
          />
        ) : (
          <View
            style={{
              borderRadius:
                isCompactPhone
                  ? 20
                  : 24,

              backgroundColor:
                "#F8FAFC",

              borderWidth: 1,

              borderColor:
                "#E4E7EC",

              padding:
                isCompactPhone
                  ? 18
                  : 22,
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,

                alignItems:
                  "center",

                justifyContent:
                  "center",

                borderRadius: 15,

                backgroundColor:
                  "#EEF4FF",
              }}
            >
              <Ionicons
                name="calendar-clear-outline"
                size={23}
                color="#0F5EFF"
              />
            </View>


            <Text
              style={{
                marginTop: 14,

                color:
                  "#101828",

                fontSize:
                  type.cardTitle,

                fontWeight:
                  "800",
              }}
            >
              No upcoming events
            </Text>


            <Text
              style={{
                marginTop: 6,

                color:
                  "#667085",

                fontSize:
                  type.body,

                lineHeight:
                  type.body +
                  8,
              }}
            >
              There are no
              scheduled events at
              the moment.
            </Text>
          </View>
        )}
      </View>


      {/*
       * =========================================
       * RECENTLY COMPLETED
       * =========================================
       */}

      {recentPastEvents.length >
      0 ? (
        <View
          style={{
            marginBottom:
              isCompactPhone
                ? 30
                : 34,
          }}
        >
          <SectionHeader
            title="Recently Completed"
            actionLabel="View all"
            onAction={
              openPastEvents
            }
            type={type}
          />


          <Text
            style={{
              marginTop: -5,

              marginBottom: 14,

              color: "#667085",

              fontSize:
                type.small,

              lineHeight:
                type.small + 6,
            }}
          >
            Recent events and
            activities.
          </Text>

<ScrollView
  horizontal
  nestedScrollEnabled
  directionalLockEnabled
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{
    paddingRight: 20,
  }}
>
  {recentPastEvents.map(
    (event, index) => (
      <View
        key={String(event._id)}
        style={{
          marginRight:
            index === recentPastEvents.length - 1
              ? 0
              : 16,
        }}
      >
        <RecentEventCard
          event={event}
          width={recentCardWidth}
          type={type}
          isCompactPhone={isCompactPhone}
          onPress={() =>
            openEvent(event)
          }
        />
      </View>
    ),
  )}
</ScrollView>
        </View>
      ) : null}


      {/*
       * =========================================
       * RECENT ALERTS
       * =========================================
       */}

      <View>
        <SectionHeader
          title="Recent Alerts"
          actionLabel="View all"
          onAction={
            openAlerts
          }
          type={type}
        />


        {recentNotifications.length ===
        0 ? (
          <View
            style={{
              borderRadius:
                isCompactPhone
                  ? 20
                  : 24,

              backgroundColor:
                "#FFFFFF",

              padding:
                layout.cardPadding,

              borderWidth: 1,

              borderColor:
                "#EAECF0",
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,

                alignItems:
                  "center",

                justifyContent:
                  "center",

                borderRadius: 15,

                backgroundColor:
                  "#EAF0F7",
              }}
            >
              <Ionicons
                name="notifications-outline"
                size={21}
                color="#001B3D"
              />
            </View>


            <Text
              style={{
                marginTop: 14,

                color:
                  "#101828",

                fontSize:
                  type.cardTitle,

                fontWeight:
                  "800",
              }}
            >
              No recent alerts
            </Text>


            <Text
              style={{
                marginTop: 6,

                color:
                  "#667085",

                fontSize:
                  type.body,

                lineHeight:
                  type.body +
                  8,
              }}
            >
              Important updates
              will appear here.
            </Text>
          </View>
        ) : (
          recentNotifications.map(
            (
              item,
              index,
            ) => (
              <Pressable
                key={String(
                  item?._id ||
                    item?.id ||
                    index,
                )}
                onPress={
                  openAlerts
                }
                style={({
                  pressed,
                }) => ({
                  marginBottom:
                    index ===
                    recentNotifications.length -
                      1
                      ? 0
                      : 12,

                  borderRadius:
                    isCompactPhone
                      ? 20
                      : 22,

                  backgroundColor:
                    item.read
                      ? "#FFFFFF"
                      : "#F0F5FF",

                  padding:
                    layout.cardPadding,

                  borderWidth: 1,

                  borderColor:
                    item.read
                      ? "#EAECF0"
                      : "#D6E4FF",

                  opacity:
                    pressed
                      ? 0.76
                      : 1,
                })}
              >
                <View
                  style={{
                    flexDirection:
                      "row",

                    alignItems:
                      "flex-start",
                  }}
                >
                  <View
                    style={{
                      width:
                        isCompactPhone
                          ? 42
                          : 46,

                      height:
                        isCompactPhone
                          ? 42
                          : 46,

                      marginRight:
                        12,

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      borderRadius:
                        15,

                      backgroundColor:
                        "#FFFFFF",
                    }}
                  >
                    <Ionicons
                      name="notifications-outline"
                      size={
                        isCompactPhone
                          ? 19
                          : 21
                      }
                      color="#001B3D"
                    />
                  </View>


                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <View
                      style={{
                        flexDirection:
                          "row",

                        alignItems:
                          "flex-start",
                      }}
                    >
                      <Text
                        numberOfLines={2}
                        style={{
                          flex: 1,

                          marginRight:
                            10,

                          color:
                            "#101828",

                          fontSize:
                            type.cardTitle,

                          lineHeight:
                            type.cardTitle +
                            7,

                          fontWeight:
                            "800",
                        }}
                      >
                        {item.title ||
                          "Alert"}
                      </Text>


                      <Text
                        style={{
                          color:
                            "#98A2B3",

                          fontSize:
                            type.small,
                        }}
                      >
                        {formatNotificationTime(
                          item.createdAt,
                        )}
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

                        color:
                          "#667085",

                        fontSize:
                          type.body,

                        lineHeight:
                          type.body +
                          8,
                      }}
                    >
                      {item.body ||
                        "Open Alerts to view this update."}
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


/*
 * =====================================================
 * SECTION HEADER
 * =====================================================
 */

function SectionHeader({
  title,
  actionLabel,
  onAction,
  type,
}) {
  return (
    <View
      style={{
        minHeight: 36,

        marginBottom: 12,

        flexDirection:
          "row",

        alignItems:
          "center",

        justifyContent:
          "space-between",
      }}
    >
      <Text
        style={{
          flex: 1,

          color: "#101828",

          fontSize:
            type.sectionTitle,

          fontWeight:
            "800",
        }}
      >
        {title}
      </Text>


      {actionLabel &&
      onAction ? (
        <Pressable
          onPress={
            onAction
          }
          hitSlop={10}
          style={({
            pressed,
          }) => ({
            marginLeft: 12,

            paddingVertical: 6,

            paddingHorizontal: 4,

            opacity:
              pressed
                ? 0.55
                : 1,
          })}
        >
          <View
            style={{
              flexDirection:
                "row",

              alignItems:
                "center",
            }}
          >
            <Text
              style={{
                color:
                  "#0F5EFF",

                fontSize:
                  type.small,

                fontWeight:
                  "800",
              }}
            >
              {actionLabel}
            </Text>


            <Ionicons
              name="arrow-forward"
              size={14}
              color="#0F5EFF"
              style={{
                marginLeft: 4,
              }}
            />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}


/*
 * =====================================================
 * SUMMARY CARD
 * =====================================================
 */

function StatCard({
  title,
  value,
  icon,
  type,
  compact,
}) {
  return (
    <View
      style={{
        flex: 1,

        minHeight:
          compact
            ? 108
            : 118,

        justifyContent:
          "center",

        borderRadius:
          compact
            ? 20
            : 24,

        backgroundColor:
          "#FFFFFF",

        padding:
          compact
            ? 15
            : 18,

        borderWidth: 1,

        borderColor:
          "#E4E7EC",
      }}
    >
      <View
        style={{
          width:
            compact
              ? 36
              : 40,

          height:
            compact
              ? 36
              : 40,

          alignItems:
            "center",

          justifyContent:
            "center",

          borderRadius:
            compact
              ? 12
              : 14,

          backgroundColor:
            "#EEF4FF",
        }}
      >
        <Ionicons
          name={icon}
          size={
            compact
              ? 18
              : 20
          }
          color="#0F5EFF"
        />
      </View>


      <Text
        style={{
          marginTop: 10,

          color: "#667085",

          fontSize:
            type.small,

          fontWeight:
            "600",
        }}
      >
        {title}
      </Text>


      <Text
        style={{
          marginTop: 4,

          color: "#101828",

          fontSize:
            compact
              ? 25
              : 29,

          lineHeight:
            compact
              ? 31
              : 35,

          fontWeight:
            "800",
        }}
      >
        {value}
      </Text>
    </View>
  );
}


/*
 * =====================================================
 * LARGE UP-NEXT CARD
 * =====================================================
 */

function FeaturedEventCard({
  event,
  onPress,
  type,
  isCompactPhone,
}) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);


  const startAt =
    getEventStart(
      event,
    );


  const endAt =
    getEventEnd(
      event,
    );


  const now =
    new Date();


  const happeningNow =
    Boolean(
      startAt &&
      startAt <= now &&
      (!endAt ||
        endAt >= now),
    );


  return (
    <Pressable
      onPress={
        onPress
      }
      style={({
        pressed,
      }) => ({
        overflow:
          "hidden",

        borderRadius:
          isCompactPhone
            ? 21
            : 24,

        backgroundColor:
          "#FFFFFF",

        borderWidth: 1,

        borderColor:
          "#DDE3EC",

        elevation: 2,

        shadowColor:
          "#101828",

        shadowOffset: {
          width: 0,
          height: 2,
        },

        shadowOpacity:
          0.07,

        shadowRadius:
          7,

        opacity:
          pressed
            ? 0.9
            : 1,
      })}
    >
      <View
        style={{
          width: "100%",

          aspectRatio:
            16 / 9,

          backgroundColor:
            "#F2F4F7",
        }}
      >
        {event?.image &&
        !imageFailed ? (
          <Image
            source={{
              uri:
                event.image,
            }}
            resizeMode="cover"
            onError={() =>
              setImageFailed(
                true,
              )
            }
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        ) : (
          <EventImageFallback />
        )}


        <View
          style={{
            position:
              "absolute",

            top: 13,
            left: 13,

            borderRadius:
              999,

            backgroundColor:
              happeningNow
                ? "#ECFDF3"
                : "#EEF4FF",

            paddingHorizontal:
              10,

            paddingVertical:
              5,
          }}
        >
          <Text
            style={{
              color:
                happeningNow
                  ? "#027A48"
                  : "#0F5EFF",

              fontSize: 10.5,

              fontWeight:
                "800",
            }}
          >
            {happeningNow
              ? "HAPPENING NOW"
              : "UP NEXT"}
          </Text>
        </View>
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
          style={{
            flexDirection:
              "row",

            alignItems:
              "center",
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color="#0F5EFF"
          />


          <Text
            style={{
              flex: 1,

              marginLeft: 7,

              color:
                "#526B93",

              fontSize:
                type.small,

              fontWeight:
                "700",
            }}
          >
            {formatFullEventDate(
              event?.startAt ||
                event?.date,
            )}
          </Text>


          {startAt ? (
            <Text
              style={{
                marginLeft: 8,

                color:
                  "#526B93",

                fontSize:
                  type.small,

                fontWeight:
                  "700",
              }}
            >
              {formatEventTime(
                startAt,
              )}
            </Text>
          ) : null}
        </View>


        <Text
          numberOfLines={2}
          style={{
            marginTop: 11,

            color: "#101828",

            fontSize:
              isCompactPhone
                ? type.cardTitle +
                  2
                : type.cardTitle +
                  3,

            lineHeight:
              isCompactPhone
                ? type.cardTitle +
                  9
                : type.cardTitle +
                  11,

            fontWeight:
              "800",
          }}
        >
          {event?.title ||
            "Untitled event"}
        </Text>


        <View
          style={{
            marginTop: 13,

            flexDirection:
              "row",

            alignItems:
              "center",
          }}
        >
          <Ionicons
            name="location-outline"
            size={17}
            color="#667085"
          />


          <Text
            numberOfLines={1}
            style={{
              flex: 1,

              marginLeft: 6,

              color:
                "#667085",

              fontSize:
                type.small,

              fontWeight:
                "600",
            }}
          >
            {event?.location ||
              "Location to be announced"}
          </Text>


          <View
            style={{
              marginLeft: 10,

              flexDirection:
                "row",

              alignItems:
                "center",
            }}
          >
            <Text
              style={{
                color:
                  "#0F5EFF",

                fontSize:
                  type.small,

                fontWeight:
                  "800",
              }}
            >
              View event
            </Text>


            <Ionicons
              name="arrow-forward"
              size={15}
              color="#0F5EFF"
              style={{
                marginLeft: 4,
              }}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}


/*
 * =====================================================
 * SMALL/MEDIUM RECENT EVENT CARD
 *
 * Horizontal carousel item:
 *
 * [ IMAGE ]  DATE
 * [ IMAGE ]  EVENT TITLE
 * [ IMAGE ]  View event →
 * =====================================================
 */
function RecentEventCard({
  event,
  onPress,
  width,
  type,
  isCompactPhone,
}) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width,

       

        overflow: "hidden",

        borderRadius: 16,

        backgroundColor:
          "#FFFFFF",

        borderWidth: 1,

        borderColor:
          "#E4E7EC",

        opacity:
          pressed
            ? 0.82
            : 1,
      })}
    >
      {/*
       * IMAGE
       *
       * Full width of the card.
       * Compact height.
       */}
      <View
        style={{
          width: "100%",

          height:
            isCompactPhone
              ? 110
              : 122,

          backgroundColor:
            "#F2F4F7",

          overflow: "hidden",
        }}
      >
        {event?.image &&
        !imageFailed ? (
          <Image
            source={{
              uri: event.image,
            }}
            resizeMode="cover"
            onError={(error) => {
            
              setImageFailed(true);
            }}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        ) : (
          <View
            style={{
              flex: 1,

              alignItems:
                "center",

              justifyContent:
                "center",

              backgroundColor:
                "#F2F4F7",
            }}
          >
            <Ionicons
              name="image-outline"
              size={26}
              color="#98A2B3"
            />
          </View>
        )}
      </View>

      {/*
       * SMALL CONTENT
       */}
      <View
        style={{
          minHeight: 104,

          paddingHorizontal:
            12,

          paddingTop: 11,

          paddingBottom: 12,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            color: "#667085",

            fontSize: 11,

            lineHeight: 15,

            fontWeight: "700",
          }}
        >
          {formatEventDate(
            event?.startAt ||
              event?.date,
          )}
        </Text>

        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={{
            marginTop: 5,

            color: "#101828",

            fontSize: 14,

            lineHeight: 19,

            fontWeight: "700",
          }}
        >
          {event?.title ||
            "Untitled event"}
        </Text>

        <View
          style={{
            marginTop: "auto",

            paddingTop: 9,

            flexDirection:
              "row",

            alignItems:
              "center",
          }}
        >
          <Text
            style={{
              color: "#0F5EFF",

              fontSize: 12,

              fontWeight: "700",
            }}
          >
            View event
          </Text>

          <Ionicons
            name="arrow-forward"
            size={13}
            color="#0F5EFF"
            style={{
              marginLeft: 4,
            }}
          />
        </View>
      </View>
    </Pressable>
  );
}


/*
 * =====================================================
 * IMAGE FALLBACK
 * =====================================================
 */

function EventImageFallback({
  compact = false,
}) {
  return (
    <View
      style={{
        flex: 1,

        alignItems:
          "center",

        justifyContent:
          "center",

        backgroundColor:
          "#F2F4F7",
      }}
    >
      <View
        style={{
          width:
            compact
              ? 38
              : 50,

          height:
            compact
              ? 38
              : 50,

          alignItems:
            "center",

          justifyContent:
            "center",

          borderRadius:
            compact
              ? 12
              : 16,

          backgroundColor:
            "#E4E7EC",
        }}
      >
        <Ionicons
          name="image-outline"
          size={
            compact
              ? 20
              : 25
          }
          color="#667085"
        />
      </View>
    </View>
  );
}