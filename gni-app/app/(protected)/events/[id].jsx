import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import * as WebBrowser from "expo-web-browser";

import { getEventById } from "@/services/eventService";
import { useResponsive } from "@/hooks/useResponsive";
import { COLORS } from "@/theme";

function toDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date;
}

function formatDate(value) {
  const date = toDate(value);

  if (!date) {
    return "Date to be announced";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );
}

function formatTime(value) {
  const date = toDate(value);

  if (!date) {
    return "Time to be announced";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

function SectionTitle({
  children,
  type,
}) {
  return (
    <Text
      style={{
        color: "#101828",

        fontSize:
          type.sectionTitle,

        lineHeight:
          type.sectionTitle + 7,

        fontWeight: "800",
      }}
    >
      {children}
    </Text>
  );
}

function InformationRow({
  icon,
  label,
  value,
  type,
  showDivider = true,
}) {
  return (
    <View>
      <View
        style={
          styles.informationRow
        }
      >
        <View
          style={
            styles.informationIcon
          }
        >
          <Ionicons
            name={icon}
            size={20}
            color="#001B3D"
          />
        </View>

        <View
          style={{
            flex: 1,
            marginLeft: 12,
          }}
        >
          <Text
            style={{
              color: "#667085",

              fontSize:
                type.small,

              lineHeight:
                type.small + 5,

              fontWeight: "600",
            }}
          >
            {label}
          </Text>

          <Text
            style={{
              marginTop: 4,

              color: "#101828",

              fontSize: type.body,

              lineHeight:
                type.body + 7,

              fontWeight: "700",
            }}
          >
            {value}
          </Text>
        </View>
      </View>

      {showDivider ? (
        <View
          style={
            styles.informationDivider
          }
        />
      ) : null}
    </View>
  );
}

export default function EventDetailsScreen() {
 const { id, source } =
  useLocalSearchParams();

const navigationSource =
  Array.isArray(source)
    ? source[0]
    : source;

  const insets =
    useSafeAreaInsets();

  const {
    width: screenWidth,
    height: screenHeight,
  } = useWindowDimensions();

  const {
    isCompactPhone,
    type,
    layout,
  } = useResponsive();

  const [event, setEvent] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  const [
    posterViewerVisible,
    setPosterViewerVisible,
  ] = useState(false);

  const eventId =
    Array.isArray(id)
      ? id[0]
      : id;



  const handleBack = useCallback(() => {
  if (posterViewerVisible) {
    setPosterViewerVisible(false);
    return;
  }

  switch (navigationSource) {
    case "notification":
      router.replace(
        "/(protected)/notifications",
      );
      return;

    case "calendar":
      router.replace(
        "/(protected)/calendar",
      );
      return;

    case "home":
      router.replace(
        "/(protected)/home",
      );
      return;

    case "profile":
      router.replace(
        "/(protected)/profile",
      );
      return;

    case "events":
    default:
      router.replace(
        "/(protected)/events",
      );
  }
}, [
  navigationSource,
  posterViewerVisible,
]);



useEffect(() => {
  const subscription =
    BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleBack();
        return true;
      },
    );

  return () => {
    subscription.remove();
  };
}, [handleBack]);

  const heroHeight =
    Math.min(
      390,

      Math.max(
        270,

        Math.round(
          screenHeight * 0.39,
        ),
      ),
    );

  const horizontalPadding =
    isCompactPhone ? 14 : 16;

  const loadEvent =
    useCallback(async () => {
      if (!eventId) {
        setEvent(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response =
          await getEventById(
            eventId,
          );

        setEvent(
          response?.event ||
            response ||
            null,
        );
      } catch (error) {
        console.log(
          "getEventById error:",
          error,
        );

        setEvent(null);
      } finally {
        setLoading(false);
      }
    }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const startAt =
    useMemo(
      () =>
        toDate(
          event?.startAt ||
            event?.date,
        ),
      [event],
    );

  const endAt =
    useMemo(
      () =>
        toDate(
          event?.endAt,
        ),
      [event],
    );

  const isPast =
    useMemo(() => {
      const comparison =
        endAt || startAt;

      return comparison
        ? comparison <
            new Date()
        : false;
    }, [
      endAt,
      startAt,
    ]);

  const openExternalUrl =
    useCallback(
      async (value) => {
        const url =
          String(
            value || "",
          ).trim();

        if (!url) {
          Alert.alert(
            "Link unavailable",
            "This link has not been added for this event.",
          );

          return;
        }

        try {
          await WebBrowser.openBrowserAsync(
            url,
            {
              toolbarColor:
                "#001B3D",

              controlsColor:
                "#FFFFFF",

              showTitle: true,

              enableBarCollapsing:
                true,
            },
          );
        } catch (error) {
          console.log(
            "Unable to open URL:",
            error,
          );

          Alert.alert(
            "Unable to open link",
            "Please try again.",
          );
        }
      },
      [],
    );

  if (loading) {
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

  if (!event) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={styles.safeArea}
      >
        <View
          style={
            styles.notFoundContainer
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color="#667085"
          />

          <Text
            style={{
              marginTop: 16,

              color: "#101828",

              fontSize:
                type.sectionTitle,

              fontWeight: "800",
            }}
          >
            Event not found
          </Text>

          <Pressable
            onPress={handleBack}
            style={styles.goBackButton}
          >
            <Text
              style={{
                color: "#FFFFFF",

                fontSize:
                  type.button,

                fontWeight: "800",
              }}
            >
              Go back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const contentSections =
    Array.isArray(
      event?.contentSections,
    )
      ? event.contentSections
      : [];

  const speakers =
    Array.isArray(
      event?.speakers,
    )
      ? event.speakers
      : [];

  const sessions =
    Array.isArray(
      event?.sessions,
    )
      ? event.sessions
      : [];

  return (
    <SafeAreaView
      edges={["top"]}
      style={styles.safeArea}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingBottom:
            100 + insets.bottom,
        }}
      >
        <View
          style={{
            width: "100%",

            maxWidth:
              layout.contentMaxWidth,

            alignSelf: "center",
          }}
        >
          {/*
            Simple navigation row.
            No centred "Event details" text.
          */}

          <View
            style={styles.topBar}
          >
            <Pressable
              onPress={handleBack}

              hitSlop={12}
              style={({ pressed }) => ({
                width: 44,
                height: 44,

                alignItems: "center",

                justifyContent:
                  "center",

                borderRadius: 14,

                backgroundColor:
                  "#F2F4F7",

                opacity:
                  pressed ? 0.72 : 1,
              })}
            >
              <Ionicons
                name="arrow-back"
                size={25}
                color="#101828"
              />
            </Pressable>
          </View>

          {/*
            Full-width hero.
            cover removes internal side gaps.
            Full poster remains available
            through the expand viewer.
          */}

         <Pressable
  onPress={
    event.image && !imageFailed
      ? () => setPosterViewerVisible(true)
      : undefined
  }
  style={{
    width: "100%",
    height: heroHeight,
    overflow: "hidden",
    backgroundColor: "#E9EDF3",
  }}
>
  {event.image && !imageFailed ? (
    <Image
      source={{ uri: event.image }}
      resizeMode="cover"
      onError={(error) => {
        console.log("Poster error:", error?.nativeEvent?.error);
        setImageFailed(true);
      }}
      style={{ width: "100%", height: "100%" }}
    />
  ) : (
    <View style={styles.imageFallback}>
      <Ionicons name="image-outline" size={48} color="#98A2B3" />
      <Text style={styles.imageFallbackText}>Poster unavailable</Text>
    </View>
  )}

  {event.image && !imageFailed ? (
    <View
      pointerEvents="none"   // keep as is – it’s inside the Pressable, so it will still trigger
      style={{
        position: "absolute",
        right: 14,
        bottom: 14,
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        backgroundColor: "rgba(0,0,0,0.72)",
      }}
    >
      <Ionicons name="expand-outline" size={22} color="#FFFFFF" />
    </View>
  ) : null}
</Pressable>

          {/*
            Flat content.
            No large outer content card.
          */}

          <View
            style={{
              paddingHorizontal:
                horizontalPadding,

              paddingTop: 24,
            }}
          >
            <Text
              style={{
                color: "#101828",

                fontSize:
                  type.heroTitle,

                lineHeight:
                  type.heroTitle + 8,

                fontWeight: "800",
              }}
            >
              {event.title}
            </Text>

            <View
              style={[
                styles.informationCard,

                {
                  borderRadius:
                    isCompactPhone
                      ? 17
                      : 20,
                },
              ]}
            >
              <InformationRow
                icon="calendar-outline"
                label="Starts"
                value={`${formatDate(
                  event.startAt ||
                    event.date,
                )} • ${formatTime(
                  event.startAt ||
                    event.date,
                )}`}
                type={type}
              />

              <InformationRow
                icon="time-outline"
                label="Ends"
                value={`${formatDate(
                  event.endAt,
                )} • ${formatTime(
                  event.endAt,
                )}`}
                type={type}
              />

              <InformationRow
                icon="location-outline"
                label="Location"
                value={
                  event.location ||
                  "Location to be announced"
                }
                type={type}
                showDivider={false}
              />
            </View>

            <View
              style={styles.section}
            >
              <SectionTitle
                type={type}
              >
                About this event
              </SectionTitle>

              <Text
                style={{
                  marginTop: 11,

                  color: "#475467",

                  fontSize:
                    type.body,

                  lineHeight:
                    type.body + 10,
                }}
              >
                {event.description}
              </Text>
            </View>

            {contentSections.map(
              (
                section,
                index,
              ) => {
                const sectionTitle =
                  String(
                    section?.title ||
                      "",
                  ).trim();

                const description =
                  String(
                    section?.description ||
                      "",
                  ).trim();

                if (
                  !sectionTitle ||
                  !description
                ) {
                  return null;
                }

                return (
                  <View
                    key={`${sectionTitle}-${index}`}
                    style={
                      styles.dividedSection
                    }
                  >
                    <SectionTitle
                      type={type}
                    >
                      {sectionTitle}
                    </SectionTitle>

                    <Text
                      style={{
                        marginTop: 11,

                        color:
                          "#475467",

                        fontSize:
                          type.body,

                        lineHeight:
                          type.body +
                          10,
                      }}
                    >
                      {description}
                    </Text>
                  </View>
                );
              },
            )}

            {speakers.length >
            0 ? (
              <View
                style={
                  styles.dividedSection
                }
              >
                <SectionTitle
                  type={type}
                >
                  Speakers
                </SectionTitle>

                <View
                  style={{
                    marginTop: 15,
                  }}
                >
                  {speakers.map(
                    (
                      speaker,
                      index,
                    ) => (
                      <View
                        key={`${speaker?.name}-${index}`}
                        style={[
                          styles.speakerCard,

                          {
                            marginBottom:
                              index ===
                              speakers.length -
                                1
                                ? 0
                                : 12,

                            borderRadius:
                              isCompactPhone
                                ? 16
                                : 19,
                          },
                        ]}
                      >
                        {speaker?.image ? (
                          <Image
                            source={{
                              uri:
                                speaker.image,
                            }}
                            resizeMode="cover"
                            style={
                              styles.speakerImage
                            }
                          />
                        ) : (
                          <View
                            style={
                              styles.speakerFallback
                            }
                          >
                            <Ionicons
                              name="person-outline"
                              size={28}
                              color="#0F5EFF"
                            />
                          </View>
                        )}

                        <View
                          style={{
                            flex: 1,

                            marginLeft: 13,
                          }}
                        >
                          <Text
                            style={{
                              color:
                                "#101828",

                              fontSize:
                                type.cardTitle,

                              lineHeight:
                                type.cardTitle +
                                6,

                              fontWeight:
                                "800",
                            }}
                          >
                            {speaker?.name}
                          </Text>

                          {speaker?.description ? (
                            <Text
                              style={{
                                marginTop: 6,

                                color:
                                  "#667085",

                                fontSize:
                                  type.small,

                                lineHeight:
                                  type.small +
                                  7,
                              }}
                            >
                              {
                                speaker.description
                              }
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ),
                  )}
                </View>
              </View>
            ) : null}

            {/*
              Registration is always rendered
              before Zoom sessions.
            */}

            <View
  style={{
    width: "100%",
    marginTop: 30,
  }}
>
  <View
    style={{
      width: "100%",
      height: 54,

      overflow: "hidden",

      borderRadius: 14,

      backgroundColor:
        isPast ||
        !event.registrationUrl
          ? "#98A2B3"
          : "#022670",
    }}
  >
    <Pressable
      disabled={
        isPast ||
        !event.registrationUrl
      }
      onPress={() =>
        openExternalUrl(
          event.registrationUrl,
        )
      }
      style={({ pressed }) => ({
        width: "100%",
        height: "100%",

        alignItems: "center",
        justifyContent: "center",

        opacity:
          pressed &&
          !isPast &&
          event.registrationUrl
            ? 0.85
            : 1,
      })}
    >
      <Text
        style={{
          width: "100%",
          height: 54,
          lineHeight: 54,

          color: "#FFFFFF",

          fontSize: 16,
          fontWeight: "700",

          textAlign: "center",
          textAlignVertical: "center",

          includeFontPadding: false,
        }}
      >
        {isPast
          ? "Registration closed"
          : !event.registrationUrl
            ? "Registration unavailable"
            : "Register now"}
      </Text>
    </Pressable>
  </View>
</View>

            {sessions.length >
            0 ? (
              <View
                style={
                  styles.dividedSection
                }
              >
                <SectionTitle
                  type={type}
                >
                  Zoom sessions
                </SectionTitle>

                <View
                  style={{
                    marginTop: 15,
                  }}
                >
                  {sessions.map(
                    (
                      session,
                      index,
                    ) => {
                      const sessionUrl =
                        String(
                          session
                            ?.zoomRegistrationUrl ||
                            "",
                        ).trim();

                      return (
                        <View
                          key={`${session?.label}-${index}`}
                          style={[
                            styles.sessionCard,

                            {
                              marginBottom:
                                index ===
                                sessions.length -
                                  1
                                  ? 0
                                  : 12,

                              borderRadius:
                                isCompactPhone
                                  ? 16
                                  : 19,
                            },
                          ]}
                        >
                          <View
                            style={
                              styles.sessionHeader
                            }
                          >
                            <View
                              style={
                                styles.sessionIcon
                              }
                            >
                              <Ionicons
                                name="videocam-outline"
                                size={21}
                                color="#001B3D"
                              />
                            </View>

                            <View
                              style={{
                                flex: 1,

                                marginLeft:
                                  12,
                              }}
                            >
                              <Text
                                style={{
                                  color:
                                    "#101828",

                                  fontSize:
                                    type.cardTitle,

                                  fontWeight:
                                    "800",
                                }}
                              >
                                {session?.label ||
                                  `Day ${
                                    index +
                                    1
                                  }`}
                              </Text>

                              <Text
                                style={{
                                  marginTop:
                                    5,

                                  color:
                                    "#667085",

                                  fontSize:
                                    type.small,

                                  lineHeight:
                                    type.small +
                                    6,
                                }}
                              >
                                {formatDate(
                                  session?.startAt,
                                )}
                              </Text>

                              <Text
                                style={{
                                  marginTop:
                                    2,

                                  color:
                                    "#667085",

                                  fontSize:
                                    type.small,
                                }}
                              >
                                Starts at{" "}
                                {formatTime(
                                  session?.startAt,
                                )}{" "}
                                IST
                              </Text>
                              <Pressable
  disabled={!sessionUrl}
  onPress={() =>
    openExternalUrl(
      sessionUrl,
    )
  }
  style={({ pressed }) => ({
    alignSelf: "flex-start",

    marginTop: 10,

    opacity:
      !sessionUrl
        ? 0.4
        : pressed
          ? 0.65
          : 1,
  })}
>
  <Text
    numberOfLines={1}
    style={{
      color: "#0F5EFF",

      marginTop: 10,

      fontSize: type.body,
      fontWeight: "800",
    }}
  >
    Register for Zoom →
  </Text>
</Pressable>

                            </View>
                          </View>

                        </View>
                      );
                    },
                  )}
                </View>
              </View>
            ) : null}

            <View
              style={{
                height: 20,
              }}
            />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={
          posterViewerVisible
        }
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setPosterViewerVisible(
            false,
          )
        }
      >
        <View style={styles.viewerContainer}>
  {/* Image first – then the button on top */}
  {event.image ? (
    <Image
      source={{ uri: event.image }}
      resizeMode="contain"
      style={{
        width: screenWidth,
        height: screenHeight,
      }}
    />
  ) : null}

  {/* Close button – now after the image, so it's guaranteed on top */}
  <Pressable
    onPress={() => setPosterViewerVisible(false)}
    hitSlop={12}
    style={({ pressed }) => ({
      position: "absolute",
      top: insets.top + 14,
      right: 16,
      zIndex: 999,              // high enough
      width: 46,
      height: 46,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 23,          // fully round
      backgroundColor: "rgba(0,0,0,0.6)", // dark semi-transparent – visible on any background
      opacity: pressed ? 0.7 : 1,
      // add a subtle shadow for better visibility
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 5,
    })}
  >
    <Ionicons name="close" size={28} color="#FFFFFF" />  
  </Pressable>
</View>

      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor:
      "#FFFFFF",
  },

  scrollView: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent:
      "center",
  },

  notFoundContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent:
      "center",

    paddingHorizontal: 24,
  },

  goBackButton: {
    marginTop: 24,

    minHeight: 50,

    minWidth: 150,

    alignItems: "center",

    justifyContent:
      "center",

    borderRadius: 14,

    backgroundColor:
      "#001B3D",
  },

  topBar: {
    height: 60,

    justifyContent:
      "center",

    paddingHorizontal: 16,

    backgroundColor:
      "#FFFFFF",
  },

  imageFallback: {
    flex: 1,

    alignItems: "center",

    justifyContent:
      "center",
  },

  imageFallbackText: {
    marginTop: 9,

    color: "#667085",

    fontSize: 13,

    fontWeight: "600",
  },

  informationCard: {
    marginTop: 20,

    overflow: "hidden",

    borderWidth: 1,

    borderColor: "#E4E7EC",

    backgroundColor:
      "#FFFFFF",

    paddingHorizontal: 14,
  },

  informationRow: {
    flexDirection: "row",

    alignItems: "flex-start",

    paddingVertical: 14,
  },

  informationIcon: {
    width: 40,

    height: 40,

    alignItems: "center",

    justifyContent:
      "center",

    borderRadius: 12,

    backgroundColor:
      "#EEF4FF",
  },

  informationDivider: {
    height: 1,

    marginLeft: 52,

    backgroundColor:
      "#EAECF0",
  },

  section: {
    marginTop: 30,
  },

  dividedSection: {
    marginTop: 28,

    paddingTop: 25,

    borderTopWidth: 1,

    borderTopColor:
      "#EAECF0",
  },

  speakerCard: {
    flexDirection: "row",

    alignItems: "center",

    borderWidth: 1,

    borderColor: "#E4E7EC",

    backgroundColor:
      "#F9FAFB",

    padding: 13,
  },

  speakerImage: {
    width: 70,

    height: 70,

    borderRadius: 17,

    backgroundColor:
      "#E9EDF3",
  },

  speakerFallback: {
    width: 70,

    height: 70,

    alignItems: "center",

    justifyContent:
      "center",

    borderRadius: 17,

    backgroundColor:
      "#EEF4FF",
  },

  sessionCard: {
    borderWidth: 1,

    borderColor: "#E4E7EC",

    backgroundColor:
      "#F9FAFB",

    padding: 15,
  },

  sessionHeader: {
    flexDirection: "row",

    alignItems: "center",
  },

  sessionIcon: {
    width: 42,

    height: 42,

    alignItems: "center",

    justifyContent:
      "center",

    borderRadius: 13,

    backgroundColor:
      "#EEF4FF",
  },

  viewerContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent:
      "center",

    backgroundColor:
      "#FFFFFF",
  },
});