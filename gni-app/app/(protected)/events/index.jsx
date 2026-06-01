import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getEvents } from "@/services/eventService";
import AppScreen from "@/components/common/AppScreen";
import { COLORS } from "@/theme";

export default function EventsScreen() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await getEvents();
        setEvents(res?.events || []);
      } catch (error) {
        console.log(error);
        Alert.alert("Error", "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const upcoming = [];
    const past = [];

    events.forEach((event) => {
      if (!event?.date) {
        upcoming.push(event);
        return;
      }

      const eventDate = new Date(event.date);

      if (isNaN(eventDate.getTime()) || eventDate >= now) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    });

    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    past.sort((a, b) => new Date(b.date) - new Date(a.date));

    return activeTab === "upcoming" ? upcoming : past;
  }, [events, activeTab]);

  const handleOpenEvent = (event) => {
    if (!event?._id) {
      Alert.alert("Error", "Invalid event id");
      return;
    }

    router.push({
      pathname: "/(protected)/events/[id]",
      params: {
        id: event._id,
        source: "events",
      },
    });
  };

  const renderHeader = () => (
    <View className="mb-7">
      <Text className="text-[32px] font-bold text-[#101828]">
        Discover
      </Text>

      <Text className="mt-2 text-[15px] leading-6 text-[#667085]">
        Explore workshops, drives, internships, and industry events.
      </Text>

      <View className="mt-7 flex-row">
        <Pressable
          onPress={() => setActiveTab("upcoming")}
          className={`mr-3 rounded-full px-5 py-3 ${
            activeTab === "upcoming" ? "bg-[#0F5EFF]" : "bg-white"
          }`}
        >
          <Text
            className={`font-semibold ${
              activeTab === "upcoming" ? "text-white" : "text-[#667085]"
            }`}
          >
            Upcoming
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("past")}
          className={`rounded-full px-5 py-3 ${
            activeTab === "past" ? "bg-[#0F5EFF]" : "bg-white"
          }`}
        >
          <Text
            className={`font-semibold ${
              activeTab === "past" ? "text-white" : "text-[#667085]"
            }`}
          >
            Past
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderEventCard = ({ item: event }) => (
    <Pressable
      onPress={() => handleOpenEvent(event)}
      className="mb-6 overflow-hidden rounded-[30px] bg-white"
    >
      <Image
        source={{
          uri:
            event.image && event.image.trim()
              ? event.image
              : "https://via.placeholder.com/600x300.png?text=Event",
        }}
        className="h-56 w-full"
        resizeMode="cover"
      />

      <View className="p-6">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="rounded-full bg-[#EEF4FF] px-3 py-1">
            <Text className="text-[12px] font-semibold text-[#0F5EFF]">
              Event
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
        </View>

        <Text className="text-[24px] font-bold leading-8 text-[#101828]">
          {event.title || "Untitled Event"}
        </Text>

        <View className="mt-5">
          <View className="mb-3 flex-row items-center">
            <Ionicons name="calendar-outline" size={16} color="#0F5EFF" />

            <Text className="ml-2 text-[14px] text-[#667085]">
              {event.date
                ? new Date(event.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Date unavailable"}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={16} color="#0F5EFF" />

            <Text className="ml-2 text-[14px] text-[#667085]">
              {event.location || "Online"}
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={3}
          className="mt-5 text-[14px] leading-6 text-[#667085]"
        >
          {event.description || "No description available"}
        </Text>

        <View className="mt-6">
          <Pressable
            onPress={() => handleOpenEvent(event)}
            className="rounded-[22px] bg-[#0F5EFF] px-5 py-4"
          >
            <Text className="text-center text-[16px] font-semibold text-white">
              View Details
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center px-10 py-24">
      <Text className="text-center text-[16px] text-[#667085]">
        No events available right now.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <AppScreen centered scroll={false}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll={false}>
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item._id}
        renderItem={renderEventCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 120,
        }}
      />
    </AppScreen>
  );
}