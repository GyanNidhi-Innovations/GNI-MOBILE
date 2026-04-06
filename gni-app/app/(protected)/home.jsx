import { View, Text, Pressable } from "react-native";
import { useAuthStore } from "@/stores/authStore";

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#f5f5f5" }}>
      
      {/* Header */}
      <Text style={{ fontSize: 26, fontWeight: "bold" }}>
        GyanNidhi
      </Text>

      <Text style={{ marginTop: 5, color: "#555" }}>
        Welcome back, {user?.name}
      </Text>

      {/* Cards */}
      <View style={{ marginTop: 30 }}>

        <Pressable style={card}>
          <Text style={cardTitle}>📅 Events</Text>
          <Text style={cardDesc}>View upcoming events</Text>
        </Pressable>

        <Pressable style={card}>
          <Text style={cardTitle}>📆 Calendar</Text>
          <Text style={cardDesc}>Your schedule & reminders</Text>
        </Pressable>

        <Pressable style={card}>
          <Text style={cardTitle}>🔔 Notifications</Text>
          <Text style={cardDesc}>Latest updates</Text>
        </Pressable>

      </View>
    </View>
  );
}

const card = {
  backgroundColor: "white",
  padding: 16,
  borderRadius: 12,
  marginBottom: 15,
  elevation: 3,
};

const cardTitle = {
  fontSize: 18,
  fontWeight: "600",
};

const cardDesc = {
  color: "gray",
  marginTop: 4,
};