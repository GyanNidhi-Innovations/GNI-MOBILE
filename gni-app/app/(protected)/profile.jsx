import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { eventsData } from "@/data/eventsData";

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const registeredEvents = useAuthStore((state) => state.registeredEvents);

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-base text-gray-600">No user data found</Text>
      </View>
    );
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-5">
        {/* Header Card */}
        <View className="bg-blue-900 rounded-3xl p-6 mb-5">
          <View className="flex-row items-center">
            <View className="h-20 w-20 rounded-full bg-blue-200 items-center justify-center mr-4">
              <Text className="text-2xl font-bold text-blue-900">{initials}</Text>
            </View>

            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">
                {user.name || "User"}
              </Text>
              <Text className="text-blue-100 mt-1">
                {user.email || "No email"}
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Details Card */}
        <View className="bg-white rounded-2xl p-5 mb-5">
          <Text className="text-lg font-bold text-blue-900 mb-4">
            Personal Details
          </Text>

          <ProfileItem
            icon="person-outline"
            label="Name"
            value={user.name}
          />
          <Divider />

          <ProfileItem
            icon="mail-outline"
            label="Email"
            value={user.email}
          />
          <Divider />

          <ProfileItem
            icon="call-outline"
            label="Phone"
            value={user.phone}
          />
          <Divider />

          <ProfileItem
            icon="school-outline"
            label="College"
            value={user.college}
          />
        </View>

        <View className="bg-white rounded-2xl p-5 mb-5">
  <Text className="text-lg font-bold text-blue-900 mb-4">
    Registered Events
  </Text>

  {registeredEvents.length === 0 ? (
    <Text className="text-gray-500">
      No registered events yet
    </Text>
  ) : (
    registeredEvents.map((eventId) => {
      const event = eventsData[eventId];

      return (
        <View
          key={eventId}
          className="flex-row items-center mb-3"
        >
          <Text className="text-blue-600 mr-2">🎯</Text>
          <Text className="text-black font-medium">
            {event?.title || "Unknown Event"}
          </Text>
        </View>
      );
    })
  )}
</View>

        {/* Quick Info Card */}
        <View className="bg-blue-50 rounded-2xl p-5 mb-5 border border-blue-100">
          <Text className="text-lg font-bold text-blue-900 mb-4">
            Account Overview
          </Text>

          <View className="flex-row justify-between">
            <InfoBox title="Status" value="Active" />
            <InfoBox title="Role" value="Student" />
          </View>
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={() => {
            logout();
            router.replace("/auth/login");
          }}
          className="bg-red-700 py-4 rounded-2xl flex-row items-center justify-center"
        >
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text className="text-white font-semibold text-base ml-2">
            Logout
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ProfileItem({ icon, label, value }) {
  return (
    <View className="flex-row items-center">
      <View className="h-11 w-11 rounded-full bg-blue-100 items-center justify-center mr-3">
        <Ionicons name={icon} size={20} color="#1d4ed8" />
      </View>

      <View className="flex-1">
        <Text className="text-xs text-gray-500 mb-1">{label}</Text>
        <Text className="text-base font-semibold text-black">
          {value || "-"}
        </Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-gray-200 my-4" />;
}

function InfoBox({ title, value }) {
  return (
    <View className="bg-white rounded-xl px-4 py-4 items-center flex-1 mx-1">
      <Text className="text-xs text-gray-500">{title}</Text>
      <Text className="text-base font-bold text-blue-900 mt-1">{value}</Text>
    </View>
  );
}