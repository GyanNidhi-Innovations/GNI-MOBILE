import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { loginUserApi } from "../../src/services/authService";
import { useAuthStore } from "../../src/stores/authStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    console.log("Login button clicked");

    if (!email.trim() || !password.trim()) {
      console.log("Validation failed: email or password missing");
      Alert.alert("Validation", "Please enter email and password");
      return;
    }

    if (loading) {
      console.log("Login skipped because loading is true");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        email: email.trim(),
        password: password.trim(),
      };

      console.log("Sending login payload:", payload);

      const response = await loginUserApi(payload);

      console.log("Login API response:", response);

      if (response?.success) {
        setAuth({
          user: response.user,
          token: response.token || null,
        });

        console.log("Login success, navigating to home");
        router.replace("/(protected)/home");
      } else {
        console.log("Login failed response:", response);
        Alert.alert("Login failed", response?.message || "Invalid credentials");
      }
    } catch (error) {
      console.log("Login error full object:", error);
      console.log("Login error message:", error?.message);
      console.log("Login error response:", error?.response?.data);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong"
      );
    } finally {
      console.log("Login request finished");
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

      <View className="mb-5 flex-row items-center rounded-xl border border-gray-300 px-4">
        <TextInput
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          className="flex-1 py-3"
        />
        <Pressable onPress={() => setShowPassword(!showPassword)}>
          <Text className="font-semibold text-blue-600">
            {showPassword ? "Hide" : "Show"}
          </Text>
        </Pressable>
      </View>

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