import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { loginUserApi } from "../../src/services/authService";
import { useAuthStore } from "../../src/stores/authStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Validation", "Please enter email and password");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      const response = await loginUserApi({
        email: email.trim(),
        password: password.trim(),
      });

      if (response.success) {
        setAuth({
        user: response.user,
        token: null
      });
        router.replace("/(protected)/home");
      } else {
        Alert.alert("Login failed", response.message || "Invalid credentials");
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="mb-2 text-center text-3xl font-bold text-black">
        GyanNidhi
      </Text>

      <Text className="mb-8 text-center text-base text-gray-500">
        Login to continue
      </Text>

      <TextInput
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="mb-4 rounded-xl border border-gray-300 px-4 py-3"
      />

      <TextInput
        placeholder="Enter password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="mb-5 rounded-xl border border-gray-300 px-4 py-3"
      />

      <Pressable
        onPress={handleLogin}
        disabled={loading}
        className="items-center rounded-xl bg-blue-600 py-3"
      >
        <Text className="text-base font-semibold text-white">
          {loading ? "Logging in..." : "Login"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/auth/signup")}>
        <Text className="mt-5 text-center text-sm text-blue-600">
          Don&apos;t have an account? Sign up
        </Text>
      </Pressable>
    </View>
  );
}