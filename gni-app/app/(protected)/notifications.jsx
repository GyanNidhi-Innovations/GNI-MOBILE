import { View, Text, FlatList } from "react-native";
import { useAuthStore } from "@/stores/authStore";

export default function NotificationsScreen() {
  const notifications = useAuthStore((state) => state.notifications);

  return (
    <View className="flex-1 bg-gray-100 p-5">
      <Text className="text-xl font-bold mb-4">Notifications</Text>

      {notifications.length === 0 ? (
        <Text className="text-gray-500">No notifications yet</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl mb-3 shadow-sm">
              <Text className="text-black font-medium">
                {item.message}
              </Text>

              <Text className="text-gray-400 text-xs mt-1">
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}