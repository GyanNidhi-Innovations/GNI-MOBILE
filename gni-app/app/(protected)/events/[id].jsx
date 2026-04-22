import { View, Text, Pressable, Image, ScrollView, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { getEventById } from "@/services/eventService";
import { apiClient } from "@/services/apiClient";

export default function EventDetailsScreen() {
  const { id, source } = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const isRegistered =
    event?.registeredUsers?.some(
      (registeredUserId) =>
        registeredUserId?.toString() === user?.id?.toString()
    ) || false;

  const isFull =
    typeof event?.seats === "number" &&
    event?.seats > 0 &&
    (event?.registeredUsers?.length || 0) >= event.seats;

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);

        const res = await getEventById(id);
        if (res?.success) {
          setEvent(res.event);
        } else {
          setEvent(null);
        }
      } catch (error) {
        console.log("fetchEvent error:", error);
        Alert.alert("Error", "Failed to load event details");
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  const handleRegister = async () => {
    try {
      if (!user?.id) {
        Alert.alert("Error", "Please login first");
        return;
      }

      if (!id) {
        Alert.alert("Error", "Invalid event id");
        return;
      }

      if (isRegistered) {
        Alert.alert("Info", "You are already registered for this event");
        return;
      }

      if (isFull) {
        Alert.alert("Info", "No seats available for this event");
        return;
      }

      setRegistering(true);

      const res = await apiClient(`/events/${id}/register`, {
        method: "POST",
        body: JSON.stringify({ userId: user.id }),
      });

      if (res?.success) {
        setEvent((prev) => ({
          ...prev,
          registeredUsers: [...(prev?.registeredUsers || []), user.id],
        }));

        Alert.alert("Success", "You have registered for this event");
      } else {
        Alert.alert("Error", res?.message || "Registration failed");
      }
    } catch (error) {
      console.log("handleRegister error:", error);
      Alert.alert("Error", error?.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-base text-gray-600">Loading event...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-base text-gray-600">Event not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <Image
        source={{
          uri:
            event.image && event.image.trim()
              ? event.image
              : "https://via.placeholder.com/600x300.png?text=Event+Image",
        }}
        className="w-full h-64"
        resizeMode="cover"
      />

      <View className="p-5">
        <View className="bg-white rounded-2xl p-5 shadow-md">
          {source === "calendar" && (
            <Text className="text-blue-600 text-sm mb-2 font-medium">
              Opened from Calendar
            </Text>
          )}

          <Text className="text-2xl font-bold text-gray-900 mb-3">
            {event.title}
          </Text>

          <Text className="text-gray-700 mb-1">
            📅 {event.date ? new Date(event.date).toLocaleString() : "-"}
          </Text>

          <Text className="text-gray-700 mb-4">
            📍 {event.location || "-"}
          </Text>

          <Text className="text-gray-600 leading-6 mb-3">
            {event.description || "No description available"}
          </Text>

          {typeof event.seats === "number" && (
            <Text className="text-gray-700 mb-6">
              Seats: {event.registeredUsers?.length || 0} / {event.seats}
            </Text>
          )}

          <Pressable
            disabled={isRegistered || registering || isFull}
            onPress={handleRegister}
            className={`py-4 rounded-xl ${
              isRegistered || registering || isFull
                ? "bg-gray-400"
                : "bg-blue-600"
            }`}
          >
            <Text className="text-white text-center font-semibold text-base">
              {isFull
                ? "Full"
                : isRegistered
                ? "Registered"
                : registering
                ? "Registering..."
                : "Register"}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}