import { useEffect, useMemo, useState } from "react";
import {
  View,
  ActivityIndicator,
  Alert,
  Text,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

import { apiClient } from "@/services/apiClient";

import AppScreen from "@/components/common/AppScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  COLORS,
} from "@/theme";

export default function CalendarScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        const res = await apiClient("/events/calendar/all");
        setEvents(res?.events || []);
      } catch (error) {
        console.log("calendar fetch error:", error);
        Alert.alert("Error", "Failed to load calendar");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarEvents();
  }, []);

  const eventsByDate = useMemo(() => {
    const map = {};

    events.forEach((event) => {
      if (!event?.date) return;

      const dateKey = new Date(event.date).toISOString().split("T")[0];

      if (!map[dateKey]) map[dateKey] = [];

      map[dateKey].push(event);
    });

    return map;
  }, [events]);

  const markedDates = useMemo(() => {
    const marks = {};

    Object.keys(eventsByDate).forEach((dateKey) => {
      marks[dateKey] = {
        marked: true,
        dotColor: COLORS.primary,
      };
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: COLORS.primary,
        selectedTextColor: COLORS.white,
      };
    }

    return marks;
  }, [eventsByDate, selectedDate]);

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  const handleOpenEvent = (event) => {
    if (!event?._id) {
      Alert.alert("Error", "This event does not have a valid id");
      return;
    }

    router.push({
      pathname: "/(protected)/events/[id]",
      params: {
        id: event._id,
        source: "calendar",
      },
    });
  };

  const readableSelectedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;
if (loading) {
  return (
    <AppScreen centered scroll={false}>
      <ActivityIndicator
        size="small"
        color={COLORS.primary}
      />
    </AppScreen>
  );
}

  return (
  <AppScreen
    contentStyle={{
  paddingTop: 8,
  paddingBottom: 120,
}}
  >
      <View className="mb-7">
        <Text className="text-[32px] font-bold text-[#101828]">Calendar</Text>

        <Text className="mt-2 text-[15px] leading-6 text-[#667085]">
          Track upcoming events and open details directly from selected dates.
        </Text>
      </View>

      <View className="overflow-hidden rounded-[30px] bg-white p-3">
        <Calendar
          markedDates={markedDates}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          renderHeader={(date) => {
            const monthOnly = new Date(date).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            });

            return (
              <Text className="py-4 text-[20px] font-bold text-[#101828]">
                {monthOnly}
              </Text>
            );
          }}
          theme={{
  backgroundColor: COLORS.surface,
  calendarBackground: COLORS.surface,
  textSectionTitleColor: COLORS.icon,

  selectedDayBackgroundColor: COLORS.primary,
  selectedDayTextColor: COLORS.white,

  todayTextColor: COLORS.primary,
  dayTextColor: COLORS.text,
  textDisabledColor: COLORS.border,

  monthTextColor: COLORS.text,
  arrowColor: COLORS.primary,

  textMonthFontWeight: "700",
  textDayFontWeight: "500",
  textDayHeaderFontWeight: "700",
  textDayFontSize: 15,
  textDayHeaderFontSize: 12,
}}
        />
      </View>

      <View className="mt-6">
        <Text className="mb-5 text-[20px] font-bold text-[#101828]">
          {selectedDate ? readableSelectedDate : "Selected Events"}
        </Text>

        {!selectedDate ? (
          <View className="rounded-[28px] bg-white p-6">
            <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF]">
              <Ionicons name="calendar-outline" size={22} color="#0F5EFF" />
            </View>

            <Text className="text-[16px] font-semibold text-[#101828]">
              Pick a highlighted date
            </Text>

            <Text className="mt-2 text-[14px] leading-6 text-[#667085]">
              Dates with a blue dot have scheduled events.
            </Text>
          </View>
        ) : selectedEvents.length === 0 ? (
          <View className="rounded-[28px] bg-white p-6">
            <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F4F7]">
              <Ionicons name="calendar-clear-outline" size={22} color="#667085" />
            </View>

            <Text className="text-[16px] font-semibold text-[#101828]">
              No events scheduled
            </Text>

            <Text className="mt-2 text-[14px] leading-6 text-[#667085]">
              There are no events for this date.
            </Text>
          </View>
        ) : (
          selectedEvents.map((event) => (
            <Pressable
              key={event._id}
              onPress={() => handleOpenEvent(event)}
              className="mb-4 rounded-[28px] bg-white p-5"
            >
              <View className="flex-row items-start">
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF]">
                  <Ionicons name="calendar-outline" size={20} color="#0F5EFF" />
                </View>

                <View className="flex-1">
                  <Text className="text-[16px] font-semibold text-[#101828]">
                    {event.title || "Untitled Event"}
                  </Text>

                  <Text className="mt-2 text-[14px] text-[#667085]">
                    {event.location || "Online"}
                  </Text>

                  <Text className="mt-3 text-[12px] font-semibold text-[#0F5EFF]">
                    View details
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
              </View>
            </Pressable>
          ))
        )}
      </View>
    </AppScreen>
  );
}