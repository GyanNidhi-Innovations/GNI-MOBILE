import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { loginUserApi } from "../../src/services/authService";
import { useAuthStore } from "../../src/stores/authStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      if (response?.success) {
        console.log("LOGIN RESPONSE:", response);

        const token =
          response.token ||
          response.accessToken ||
          response.jwt ||
          response.data?.token ||
          response.data?.accessToken ||
          null;
              
        const user =
          response.user ||
          response.data?.user ||
          null;
              
        console.log("TOKEN FOUND:", token);
              
        await setAuth({
          user,
          token,
        });
      
        router.replace("/(protected)/home");
      }else {
        Alert.alert("Login failed", response?.message || "Invalid credentials");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F6F8FB]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-5 items-center" >
          <Image
            source={{
              uri: "https://res.cloudinary.com/dwqwtolrt/image/upload/c_limit,w_800,q_75,f_auto/v1760073633/logo_wvim3n.png",
            }}
            className="mb-5 h-20 w-56"
            resizeMode="contain"
          />
        </View>

        <View className="rounded-[32px] bg-white p-6">
          <Text className="mb-2 text-[13px] font-semibold text-[#101828]">
            Email Address
          </Text>

          <View className="mb-5 flex-row items-center rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-4">
            <Ionicons name="mail-outline" size={20} color="#98A2B3" />

            <TextInput
              placeholder="Enter email"
              placeholderTextColor="#667085"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              className="ml-3 flex-1 py-4 text-[15px] text-[#101828]"
            />
          </View>

          <Text className="mb-2 text-[13px] font-semibold text-[#101828]">
            Password
          </Text>

          <View className="mb-6 flex-row items-center rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-4">
            <Ionicons name="lock-closed-outline" size={20} color="#98A2B3" />

            <TextInput
              placeholder="Enter password"
              placeholderTextColor="#667085"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              className="ml-3 flex-1 py-4 text-[15px] text-[#101828]"
            />

            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Text className="text-[13px] font-semibold text-[#0F5EFF]">
                {showPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className={`items-center rounded-[22px] py-4 ${
              loading ? "bg-[#D0D5DD]" : "bg-[#0F5EFF]"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-[16px] font-semibold text-white">
                Login
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => router.push("/auth/signup")}>
          <Text className="mt-8 text-center text-[14px] font-semibold text-[#0F5EFF]">
            Don&apos;t have an account? Sign up
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}