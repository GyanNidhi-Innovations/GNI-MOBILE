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
import { getEvents } from "@/services/eventService";

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
        console.log("fetchEvents error:", error);
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

      if (isNaN(eventDate.getTime())) {
        upcoming.push(event);
        return;
      }

      if (eventDate >= now) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    });

    upcoming.sort((a, b) => {
      const aDate = a?.date ? new Date(a.date).getTime() : Infinity;
      const bDate = b?.date ? new Date(b.date).getTime() : Infinity;
      return aDate - bDate;
    });

    past.sort((a, b) => {
      const aDate = a?.date ? new Date(a.date).getTime() : 0;
      const bDate = b?.date ? new Date(b.date).getTime() : 0;
      return bDate - aDate;
    });

    return activeTab === "upcoming" ? upcoming : past;
  }, [events, activeTab]);

  const handleOpenEvent = (event) => {
    if (!event?._id) {
      Alert.alert("Error", "This event does not have a valid id");
      return;
    }

    router.push({
      pathname: "/events/[id]",
      params: {
        id: event._id,
        source: "events",
      },
    });
  };

  const renderEventCard = ({ item: event }) => (
    <Pressable
      onPress={() => handleOpenEvent(event)}
      className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm"
    >
      <Image
        source={{
          uri:
            event.image && event.image.trim()
              ? event.image
              : "https://via.placeholder.com/600x300.png?text=Event+Image",
        }}
        className="w-full h-48"
        resizeMode="cover"
      />

      <View className="p-4">
        <Text className="text-lg font-bold text-gray-900 mb-1">
          {event.title || "Untitled Event"}
        </Text>

        <Text className="text-gray-600 text-sm mb-1">
          📍 {event.location || "-"}
        </Text>

        <Text className="text-gray-600 text-sm mb-2">
          📅{" "}
          {event.date
            ? new Date(event.date).toLocaleDateString()
            : "Date not available"}
        </Text>

        <Text className="text-gray-500 text-sm">
          {event.description || "No description available"}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-100 px-5 pt-4">
      <View className="flex-row mb-5">
        <Pressable
          onPress={() => setActiveTab("upcoming")}
          className={`flex-1 py-3 rounded-xl mr-1.5 ${
            activeTab === "upcoming" ? "bg-blue-600" : "bg-gray-200"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "upcoming" ? "text-white" : "text-gray-900"
            }`}
          >
            Upcoming Events
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("past")}
          className={`flex-1 py-3 rounded-xl ml-1.5 ${
            activeTab === "past" ? "bg-blue-600" : "bg-gray-200"
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "past" ? "text-white" : "text-gray-900"
            }`}
          >
            Past Events
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#2563eb" />
        </View>
      ) : filteredEvents.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">No events available</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item._id}
          renderItem={renderEventCard}
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}