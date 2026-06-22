import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/authStore";
import { getEventById } from "@/services/eventService";
import { apiClient } from "@/services/apiClient";

export default function EventDetailsScreen() {
  const { id, source } = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const userId = user?.id || user?._id;

  const isRegistered =
    event?.registeredUsers?.some((registeredUserId) => {
      if (typeof registeredUserId === "object") {
        return registeredUserId?._id?.toString() === userId?.toString();
      }

      return registeredUserId?.toString() === userId?.toString();
    }) || false;

  const isFull = false;

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);

        const res = await getEventById(id);

        setEvent(res?.success ? res.event : null);
      } catch (error) {
        console.log("fetchEvent error:", error);
        Alert.alert("Error", "Failed to load event details");
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    try {
      if (!userId) {
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
        body: JSON.stringify({ userId }),
      });

      if (res?.success) {
        setEvent((prev) => ({
          ...prev,
          registeredUsers: [...(prev?.registeredUsers || []), userId],
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

  const getButtonText = () => {
    if (isRegistered) return "Already Registered";
    if (registering) return "Registering...";
    return "Register Now";
  };

  const disabled = isRegistered || registering;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F6F8FB]">
        <ActivityIndicator size="small" color="#0F5EFF" />

        <Text className="mt-3 text-[14px] text-[#667085]">
          Loading event...
        </Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F6F8FB] px-8">
        <Text className="text-center text-[16px] text-[#667085]">
          Event not found
        </Text>

        <Pressable
          onPress={() => router.back()}
          className="mt-5 rounded-2xl bg-[#0F5EFF] px-6 py-3"
        >
          <Text className="font-semibold text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F6F8FB]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 190 + insets.bottom,
        }}
      >
        <View className="relative">
          <Image
            source={{
              uri:
                event.image && event.image.trim()
                  ? event.image
                  : "https://via.placeholder.com/800x500.png?text=Event",
            }}
            className="h-80 w-full"
            resizeMode="cover"
          />

          <Pressable
            onPress={() => router.back()}
            style={{
            position: "absolute",
            left: 20,
            top: insets.top + 16,
          }}
          className="h-11 w-11 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="chevron-back" size={22} color="#101828" />
          </Pressable>
        </View>

        <View className="-mt-8 rounded-t-[32px] bg-[#F6F8FB] px-5 pt-8">
          {source === "calendar" && (
            <View className="mb-4 self-start rounded-full bg-[#EEF4FF] px-4 py-2">
              <Text className="text-[12px] font-semibold text-[#0F5EFF]">
                Opened from Calendar
              </Text>
            </View>
          )}

          <Text className="text-[32px] font-bold leading-10 text-[#101828]">
            {event.title || "Untitled Event"}
          </Text>

          <View className="mt-6 rounded-[28px] bg-white p-5">
            <InfoRow
              icon="calendar-outline"
              label="Date & Time"
              value={event.date ? new Date(event.date).toLocaleString() : "-"}
            />

            <Divider />

            <InfoRow
              icon="location-outline"
              label="Location"
              value={event.location || "Online"}
            />
          </View>

          <View className="mt-6 rounded-[28px] bg-white p-5">
            <Text className="mb-3 text-[18px] font-bold text-[#101828]">
              About this event
            </Text>

            <Text className="text-[15px] leading-7 text-[#667085]">
              {event.description || "No description available"}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 100 + insets.bottom,
          backgroundColor: "white",
          borderRadius: 28,
          paddingHorizontal: 14,
          paddingTop: 14,
          paddingBottom: 14,
          zIndex: 999,
          elevation: 20,
        }}
      >
        <Pressable
          disabled={disabled}
          onPress={handleRegister}
          className={`rounded-[22px] py-4 ${
            disabled ? "bg-[#0062ff]" : "bg-[#0F5EFF]"
          }`}
        >
          <Text className="text-center text-[16px] font-semibold text-white">
            {getButtonText()}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View className="flex-row items-center">
      <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF]">
        <Ionicons name={icon} size={20} color="#0F5EFF" />
      </View>

      <View className="flex-1">
        <Text className="text-[12px] font-medium text-[#98A2B3]">
          {label}
        </Text>

        <Text className="mt-1 text-[15px] font-semibold text-[#101828]">
          {value}
        </Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View className="my-5 h-px bg-[#EAECF0]" />;
}