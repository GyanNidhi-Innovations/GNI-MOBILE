import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { router } from "expo-router";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

import { apiClient } from "@/services/apiClient";
import AppScreen from "@/components/common/AppScreen";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useResponsive } from "@/hooks/useResponsive";
import { COLORS } from "@/theme";

export default function CalendarScreen() {
  const [events, setEvents] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [selectedDate, setSelectedDate] =
    useState(null);

  const {
    isCompactPhone,
    type,
    layout,
  } = useResponsive();

  const fetchCalendarEvents = async (
    showLoader = true,
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await apiClient(
        "/events/calendar/all",
      );

      setEvents(
        response?.events || [],
      );
    } catch (error) {
      console.log(
        "calendar fetch error:",
        error,
      );

      Alert.alert(
        "Unable to load calendar",
        error?.message ||
          "Please try again.",
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCalendarEvents(true);
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchCalendarEvents(false);
    } finally {
      setRefreshing(false);
    }
  };

  const eventsByDate = useMemo(() => {
    const map = {};

    events.forEach((event) => {
      if (!event?.date) return;

      const date = new Date(
        event.date,
      );

      if (
        Number.isNaN(date.getTime())
      ) {
        return;
      }

      const dateKey = date
        .toISOString()
        .split("T")[0];

      if (!map[dateKey]) {
        map[dateKey] = [];
      }

      map[dateKey].push(event);
    });

    return map;
  }, [events]);

  const markedDates = useMemo(() => {
    const marks = {};

    Object.keys(eventsByDate).forEach(
      (dateKey) => {
        marks[dateKey] = {
          marked: true,
          dotColor: "#001B3D",
        };
      },
    );

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: "#001B3D",
        selectedTextColor: "#FFFFFF",
      };
    }

    return marks;
  }, [eventsByDate, selectedDate]);

  const selectedEvents = selectedDate
    ? eventsByDate[selectedDate] || []
    : [];

  const readableSelectedDate =
    selectedDate
      ? new Date(
          `${selectedDate}T00:00:00`,
        ).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : null;

  const handleOpenEvent = (event) => {
    if (!event?._id) {
      Alert.alert(
        "Unable to open event",
        "This event does not have a valid ID.",
      );
      return;
    }

    router.push({
      pathname:
        "/(protected)/events/[id]",
      params: {
        id: String(event._id),
        source: "calendar",
      },
    });
  };

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
      refreshing={refreshing}
      onRefresh={handleRefresh}
      maxWidth={
        layout.contentMaxWidth
      }
      bottomSpace={60}
      contentStyle={{
        paddingHorizontal:
          layout.horizontalPadding,
        paddingTop: 8,
      }}
    >
      <ScreenHeader
        title="Calendar"
        subtitle="Choose a highlighted date to view scheduled workshops, webinars, drives, and industry events."
      />

      <View
        style={{
          overflow: "hidden",
          borderRadius:
            isCompactPhone ? 22 : 28,
          backgroundColor: "#FFFFFF",
          padding:
            isCompactPhone ? 6 : 10,
          borderWidth: 1,
          borderColor: "#EAECF0",
        }}
      >
        <Calendar
          markedDates={markedDates}
          onDayPress={(day) =>
            setSelectedDate(
              day.dateString,
            )
          }
          renderHeader={(date) => {
            const monthOnly =
              new Date(
                date,
              ).toLocaleDateString(
                undefined,
                {
                  month: "long",
                  year: "numeric",
                },
              );

            return (
              <Text
                style={{
                  paddingVertical:
                    isCompactPhone
                      ? 12
                      : 16,
                  color: "#101828",
                  fontSize:
                    type.sectionTitle,
                  fontWeight: "800",
                }}
              >
                {monthOnly}
              </Text>
            );
          }}
          theme={{
            backgroundColor:
              "#FFFFFF",
            calendarBackground:
              "#FFFFFF",
            textSectionTitleColor:
              "#667085",
            selectedDayBackgroundColor:
              "#001B3D",
            selectedDayTextColor:
              "#FFFFFF",
            todayTextColor:
              "#001B3D",
            dayTextColor:
              "#101828",
            textDisabledColor:
              "#D0D5DD",
            monthTextColor:
              "#101828",
            arrowColor:
              "#001B3D",
            textMonthFontWeight:
              "800",
            textDayFontWeight:
              "600",
            textDayHeaderFontWeight:
              "700",
            textDayFontSize:
              isCompactPhone
                ? 13
                : 15,
            textDayHeaderFontSize:
              isCompactPhone
                ? 11
                : 12,
          }}
        />
      </View>

      <View
        style={{
          marginTop:
            isCompactPhone ? 22 : 28,
        }}
      >
        <Text
          style={{
            marginBottom: 16,
            color: "#101828",
            fontSize:
              type.sectionTitle,
            fontWeight: "800",
          }}
        >
          {selectedDate
            ? readableSelectedDate
            : "Events by date"}
        </Text>

        {!selectedDate ? (
          <CalendarStateCard
            icon="calendar-outline"
            title="Pick a highlighted date"
            body="Dates with a dark blue dot have scheduled events."
            type={type}
            layout={layout}
          />
        ) : selectedEvents.length ===
          0 ? (
          <CalendarStateCard
            icon="calendar-clear-outline"
            title="No events scheduled"
            body="There are no events for this date."
            type={type}
            layout={layout}
            muted
          />
        ) : (
          selectedEvents.map(
            (event) => (
              <Pressable
                key={String(event._id)}
                onPress={() =>
                  handleOpenEvent(event)
                }
                style={{
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems:
                    "flex-start",
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
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF0F7]">
                  <Ionicons
                    name="calendar-outline"
                    size={21}
                    color="#001B3D"
                  />
                </View>

                <View className="flex-1">
                  <Text
                    style={{
                      color: "#101828",
                      fontSize:
                        type.cardTitle,
                      lineHeight:
                        type.cardTitle +
                        7,
                      fontWeight: "800",
                    }}
                  >
                    {event.title ||
                      "Untitled Event"}
                  </Text>

                  <Text
                    style={{
                      marginTop: 7,
                      color: "#667085",
                      fontSize:
                        type.body,
                      lineHeight:
                        type.body + 7,
                    }}
                  >
                    {event.location ||
                      "Online"}
                  </Text>

                  <Text
                    style={{
                      marginTop: 10,
                      color: "#001B3D",
                      fontSize:
                        type.small,
                      fontWeight: "800",
                    }}
                  >
                    View details
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#98A2B3"
                />
              </Pressable>
            ),
          )
        )}
      </View>
    </AppScreen>
  );
}

function CalendarStateCard({
  icon,
  title,
  body,
  type,
  layout,
  muted = false,
}) {
  return (
    <View
      style={{
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        padding: layout.cardPadding,
        borderWidth: 1,
        borderColor: "#EAECF0",
      }}
    >
      <View
        style={{
          width: 50,
          height: 50,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          backgroundColor: muted
            ? "#F2F4F7"
            : "#EAF0F7",
        }}
      >
        <Ionicons
          name={icon}
          size={23}
          color={
            muted
              ? "#667085"
              : "#001B3D"
          }
        />
      </View>

      <Text
        style={{
          marginTop: 14,
          color: "#101828",
          fontSize: type.cardTitle,
          fontWeight: "800",
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          marginTop: 7,
          color: "#667085",
          fontSize: type.body,
          lineHeight: type.body + 8,
        }}
      >
        {body}
      </Text>
    </View>
  );
}
