import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "../src/stores/authStore";

export default function Index() {
  const token = useAuthStore((state) => state.token);
  const authLoading = useAuthStore((state) => state.authLoading);

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (token) {
    return <Redirect href="/(protected)/home" />;
  }

  return <Redirect href="/auth/login" />;
}