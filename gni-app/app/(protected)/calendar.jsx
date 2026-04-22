import { useEffect, useMemo, useState } from "react";
import { View, ActivityIndicator, Alert, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Calendar } from "react-native-calendars";
import { apiClient } from "@/services/apiClient";

export default function CalendarScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

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

      if (!map[dateKey]) {
        map[dateKey] = [];
      }

      map[dateKey].push(event);
    });

    return map;
  }, [events]);

  const markedDates = useMemo(() => {
    const marks = {};

    Object.keys(eventsByDate).forEach((dateKey) => {
      marks[dateKey] = {
        marked: true,
        dotColor: "#2563eb",
      };
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: "#2563eb",
        selectedTextColor: "#ffffff",
      };
    }

    return marks;
  }, [eventsByDate, selectedDate]);

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <ActivityIndicator size="small" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100 p-5">
      <View className="bg-white rounded-2xl overflow-hidden">
        <Calendar
  markedDates={markedDates}
  onDayPress={handleDayPress}
  renderHeader={(date) => {
    const monthOnly = new Date(date).toLocaleDateString(undefined, {
      month: "long",
    });

    return (
      <Text className="text-lg font-bold text-gray-900 py-3">
        {monthOnly}
      </Text>
    );
  }}
  theme={{
    backgroundColor: "#ffffff",
    calendarBackground: "#ffffff",
    textSectionTitleColor: "#6b7280",
    selectedDayBackgroundColor: "#2563eb",
    selectedDayTextColor: "#ffffff",
    todayTextColor: "#2563eb",
    dayTextColor: "#111827",
    textDisabledColor: "#d1d5db",
    monthTextColor: "#111827",
    arrowColor: "#2563eb",
    textMonthFontWeight: "700",
    textDayFontWeight: "500",
    textDayHeaderFontWeight: "600",
  }}
/>
      </View>

      <View className="mt-4 bg-white rounded-2xl p-4">
        {!selectedDate ? (
          <Text className="text-sm text-gray-600">
            Tap a highlighted date to see events.
          </Text>
        ) : selectedEvents.length === 0 ? (
          <>
            <Text className="text-base font-semibold text-gray-900 mb-2">
              {new Date(selectedDate).toLocaleDateString()}
            </Text>
            <Text className="text-sm text-gray-600">
              No events scheduled for this date.
            </Text>
          </>
        ) : (
          <>
            <Text className="text-base font-semibold text-gray-900 mb-3">
              {new Date(selectedDate).toLocaleDateString()}
            </Text>

            {selectedEvents.map((event, index) => (
              <View key={event._id}>
                <Pressable
                  onPress={() => handleOpenEvent(event)}
                  className="py-3"
                >
                  <Text className="text-base font-medium text-blue-700">
                    {event.title || "Untitled Event"}
                  </Text>

                  <Text className="text-sm text-gray-500 mt-1">
                    {event.location || "-"}
                  </Text>
                </Pressable>

                {index !== selectedEvents.length - 1 && (
                  <View className="h-px bg-gray-200" />
                )}
              </View>
            ))}
          </>
        )}
      </View>
    </View>
  );
}