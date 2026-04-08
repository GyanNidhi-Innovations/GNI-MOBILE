import { useState } from "react";
import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { Image } from "react-native";

const upcomingEvents = [
  {
    _id: "1",
    title: "System Engineer Workshop",
    location: "Hyderabad",
    date: "30 Mar 2026",
    description: "Workshop on wireless and embedded systems.",
    image: "https://res.cloudinary.com/dwqwtolrt/image/upload/v1774350042/WhatsApp_Image_2026-03-24_at_4.30.20_PM_yszgyv.jpg",
  },
  {
    _id: "2",
    title: "VLSI Design Workshop",
    location: "Online",
    date: "5 Apr 2026",
    description: "Industry-focused VLSI design session.",
    image: "https://res.cloudinary.com/dxcyvpwyf/image/upload/v1772620135/vlsi1_zyarla.jpg",
  },
];

const pastEvents = [
  {
    _id: "3",
    title: "PCB Design Webinar",
    location: "Online",
    date: "10 Feb 2026",
    description: "Introductory webinar on PCB design concepts.",
  },
  {
    _id: "4",
    title: "Job Fair 2026",
    location: "Chennai",
    date: "20 Jan 2026",
    description: "Recruitment event for engineering students and freshers.",
  },
];

export default function EventsScreen() {
  const [activeTab, setActiveTab] = useState("upcoming");

  const events = activeTab === "upcoming" ? upcomingEvents : pastEvents;

  const handleOpenEvent = (event) => {
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
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-5">
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

        {events.length === 0 ? (
          <Text className="text-gray-500 text-center mt-5">
            No events available
          </Text>
        ) : (
          events.map((event) => (
            <Pressable
  key={event._id}
  onPress={() => handleOpenEvent(event)}
  className="bg-white rounded-2xl mb-4 overflow-hidden shadow-md"
>
  {/* IMAGE */}
  <Image
    source={{ uri: event.image }}
    className="w-full h-48"
    resizeMode="cover"
  />

  {/* CONTENT */}
  <View className="p-4">
    <Text className="text-lg font-bold text-gray-900 mb-1">
      {event.title}
    </Text>

    <Text className="text-gray-600 text-sm mb-1">
      📍 {event.location}
    </Text>

    <Text className="text-gray-600 text-sm mb-2">
      📅 {event.date}
    </Text>

    <Text className="text-gray-500 text-sm">
      {event.description}
    </Text>

    
  </View>
</Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}