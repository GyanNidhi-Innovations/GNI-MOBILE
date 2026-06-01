import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  Image,
} from "react-native";
import { router } from "expo-router";

import { loginUserApi } from "../../src/services/authService";
import { useAuthStore } from "../../src/stores/authStore";

import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
} from "../../src/theme";

import AppScreen from "../../src/components/common/AppScreen";
import AppButton from "../../src/components/ui/AppButton";
import AppInput from "../../src/components/ui/AppInput";

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
        const token =
          response.token ||
          response.accessToken ||
          response.jwt ||
          response.data?.token ||
          response.data?.accessToken ||
          null;

        const user = response.user || response.data?.user || null;

        await setAuth({ user, token });

        router.replace("/(protected)/home");
      } else {
        Alert.alert(
          "Login Failed",
          response?.message || "Invalid credentials"
        );
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
    <AppScreen centered>
      <View>
        <View
          style={{
            marginBottom: SPACING.xxxl + 8,
            alignItems: "center",
          }}
        >
          <Image
            source={{
              uri: "https://res.cloudinary.com/dwqwtolrt/image/upload/c_limit,w_800,q_75,f_auto/v1760073633/logo_wvim3n.png",
            }}
            style={{
              width: 240,
              height: 90,
            }}
            resizeMode="contain"
          />
        </View>

        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: RADIUS.xxl,
            padding: SPACING.xxl,
          }}
        >
          <AppInput
            label="Email Address"
            icon="mail-outline"
            placeholder="Enter email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            returnKeyType="next"
            blurOnSubmit={false}
          />

          <AppInput
            label="Password"
            icon="lock-closed-outline"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            rightText={showPassword ? "Hide" : "Show"}
            onRightPress={() => setShowPassword(!showPassword)}
            style={{ marginBottom: SPACING.xxl }}
          />

          <AppButton
            title="Login"
            loading={loading}
            onPress={handleLogin}
          />
        </View>

        <Pressable onPress={() => router.push("/auth/signup")}>
          <Text
            style={{
              marginTop: SPACING.xxxl,
              textAlign: "center",
              fontSize: TYPOGRAPHY.small,
              fontWeight: "600",
              color: COLORS.primary,
            }}
          >
            Don't have an account? Sign up
          </Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}