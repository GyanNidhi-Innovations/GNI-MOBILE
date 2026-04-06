import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getEventById } from "@/services/eventService";

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      console.log("event details id:", id);

      const response = await getEventById(id);

      if (response?.success) {
        setEvent(response.event);
      } else {
        console.log("event detail response:", response);
      }
    } catch (error) {
      console.log("loadEvent error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Event not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>{event.title}</Text>
      <Text style={{ marginTop: 10 }}>{event.description}</Text>
      <Text style={{ marginTop: 10, color: "gray" }}>{event.location}</Text>
    </View>
  );
}