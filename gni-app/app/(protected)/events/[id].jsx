import { View, Text, Pressable, Image, ScrollView, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";

const eventData = {
  "1": {
    title: "System Engineer Workshop",
    location: "Hyderabad",
    date: "30 Mar 2026",
    description: "Workshop on wireless and embedded systems.",
    image:
      "https://res.cloudinary.com/dwqwtolrt/image/upload/v1774350042/WhatsApp_Image_2026-03-24_at_4.30.20_PM_yszgyv.jpg",
  },
  "2": {
    title: "VLSI Design Workshop",
    location: "Online",
    date: "5 Apr 2026",
    description: "Industry-focused VLSI design session.",
    image:
      "https://res.cloudinary.com/dxcyvpwyf/image/upload/v1772620135/vlsi1_zyarla.jpg",
  },
  "3": {
    title: "PCB Design Webinar",
    location: "Online",
    date: "10 Feb 2026",
    description: "Introductory webinar on PCB design concepts.",
    image:
      "https://res.cloudinary.com/dwqwtolrt/image/upload/v1771487420/practical_pcb_lyst1759120796468_mlq8q9.png",
  },
  "4": {
    title: "Job Fair 2026",
    location: "Chennai",
    date: "20 Jan 2026",
    description: "Recruitment event for engineering students and freshers.",
    image:
      "https://res.cloudinary.com/dwqwtolrt/image/upload/v1772795916/WhatsApp_Image_2026-03-06_at_4.47.43_PM_ryxxoc.jpg",
  },
};

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [registered, setRegistered] = useState(false);
  const registerEvent = useAuthStore((state) => state.registerEvent);
  const registeredEvents = useAuthStore((state) => state.registeredEvents);
  const addNotification = useAuthStore((state) => state.addNotification);

const isRegistered = registeredEvents.includes(id);

  const event = eventData[id];

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
        source={{ uri: event.image }}
        className="w-full h-full"
        resizeMode="cover"
      />

      <View className="p-5">
        <View className="bg-white rounded-2xl p-5 shadow-md">
          <Text className="text-2xl font-bold text-gray-900 mb-3">
            {event.title}
          </Text>

          <Text className="text-gray-700 mb-1">📅 {event.date}</Text>

          <Text className="text-gray-700 mb-4">📍 {event.location}</Text>

          <Text className="text-gray-600 leading-6 mb-6">
            {event.description}
          </Text>

          <Pressable
            disabled={isRegistered}
            onPress={() => {
              registerEvent(id);
              addNotification(`You registered for ${event.title}`);
              Alert.alert("Success", "You have registered for this event");
            }}
            className={`py-4 rounded-xl ${
              isRegistered ? "bg-gray-400" : "bg-blue-600"
            }`}
          >
            <Text className="text-white text-center font-semibold text-base">
              {isRegistered ? "Registered" : "Register"}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}