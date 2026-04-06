import { useEffect, useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { getEvents } from "@/services/eventService";

export default function EventsScreen() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await getEvents();
      console.log("events response:", res);

      if (res?.success) {
        setEvents(res.events || []);
      }
    } catch (error) {
      console.log("getEvents error:", error);
    }
  };

  const handleOpenEvent = (event) => {
    console.log("clicked event:", event);

    if (!event?._id) {
      Alert.alert("Error", "This event does not have a valid id");
      return;
    }

    router.push({
      pathname: "/(protected)/events/[id]",
      params: { id: event._id },
    });
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 15 }}>
        Events
      </Text>

      {events.map((event) => (
        <Pressable
          key={event._id || event.title}
          style={{
            backgroundColor: "#fff",
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
          }}
          onPress={() => handleOpenEvent(event)}
        >
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            {event.title}
          </Text>
          <Text style={{ color: "gray" }}>{event.location}</Text>
        </Pressable>
      ))}
    </View>
  );
}