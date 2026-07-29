import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";

import { loginUserApi } from "../../src/services/authService";
import { useAuthStore } from "../../src/stores/authStore";

import {
  COLORS,
  SPACING,
  RADIUS,
} from "../../src/theme";

import AppScreen from "../../src/components/common/AppScreen";
import AppInput from "../../src/components/ui/AppInput";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

 const handleLogin = async () => {
  const cleanEmail =
    email.trim();

  const cleanPassword =
    password.trim();

  if (
    !cleanEmail ||
    !cleanPassword
  ) {
    Alert.alert(
      "Validation",
      "Please enter email and password",
    );

    return;
  }

  if (loading) {
    return;
  }

  try {
    setLoading(true);

    const response =
      await loginUserApi({
        email: cleanEmail,
        password:
          cleanPassword,
      });

    if (!response?.success) {
      throw new Error(
        response?.message ||
          "Invalid credentials",
      );
    }

    if (
      !response?.user ||
      !response?.accessToken ||
      !response?.refreshToken
    ) {
      throw new Error(
        "The server returned an incomplete login response",
      );
    }

    await setAuth({
      user:
        response.user,

      accessToken:
        response.accessToken,

      refreshToken:
        response.refreshToken,
    });

    router.replace(
      "/(protected)/home",
    );
  } catch (error) {
    Alert.alert(
      "Login Failed",
      error?.message ||
        "Something went wrong",
    );
  } finally {
    setLoading(false);
  }
};

  return (
  <AppScreen
    centered
    contentStyle={{ paddingTop: SPACING.xl }}
    maxWidth={560}
  >
    {/* Logo */}
    <View
      style={{
        alignItems: "center",
        marginBottom: SPACING.xxxl,
      }}
    >
      <Image
        source={{
          uri: "https://gyannidhi-website-assets.sfo3.cdn.digitaloceanspaces.com/images/logo_wvim3n.png",
        }}
        style={{
          width: 190,
          height: 65,
        }}
        resizeMode="contain"
      />
    </View>

   

    {/* Login form */}
    <View
      style={{
        paddingVertical: SPACING.lg,
        borderRadius: RADIUS.xl,
        backgroundColor: COLORS.surface,
      }}
    >
      <AppInput
        label="Email Address"
        icon="mail-outline"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        blurOnSubmit={false}
      />

      <AppInput
        label="Password"
        icon="lock-closed-outline"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        returnKeyType="done"
        onSubmitEditing={handleLogin}
        rightText={showPassword ? "Hide" : "Show"}
        onRightPress={() => setShowPassword((previous) => !previous)}
        style={{
          marginBottom: 0,
        }}
      />
    </View>

    {/* Sign-in button */}
<View
  style={{
    width: "100%",
    marginTop: SPACING.xl,
  }}
>
  <View
    style={{
      width: "100%",
      height: 50,
      backgroundColor: "#022670",
      borderRadius: 14,
      overflow: "hidden",
    }}
  >
    <Pressable
      disabled={loading}
      onPress={handleLogin}
      style={({ pressed }) => ({
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed && !loading ? 0.85 : 1,
      })}
    >
      {loading ? (
  <View
    style={{
      width: "100%",
      height: 50,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <ActivityIndicator size="small" color="#FFFFFF" />
  </View>
) : (
  <Text
    style={{
      width: "100%",
      height: 50,
      lineHeight: 50,
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
      textAlign: "center",
      textAlignVertical: "center",
      includeFontPadding: false,
    }}
  >
    Sign in
  </Text>
)}
    </Pressable>
  </View>
</View>

{/* Vertical space between Sign in and Forgot password */}
<View style={{ height: 16 }} />

<Pressable
  disabled={loading}
  onPress={() => router.push("/auth/forgot-password")}
  style={({ pressed }) => ({
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    opacity: pressed ? 0.65 : 1,
  })}
>
  <Text
    style={{
      color: "#0F5EFF",
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
      textAlign: "center",
    }}
  >
    Forgot password?
  </Text>
</Pressable>

{/* Vertical space between Forgot password and Signup */}
<View style={{ height: 18 }} />

<Pressable
  disabled={loading}
  onPress={() => router.push("/auth/signup")}
  style={({ pressed }) => ({
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    opacity: pressed ? 0.65 : 1,
  })}
>
  <Text
    style={{
      color: "#667085",
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    }}
  >
    Don&apos;t have an account?{" "}
    <Text
      style={{
        color: "#0F5EFF",
        fontWeight: "700",
      }}
    >
      Sign up
    </Text>
  </Text>
</Pressable>
  </AppScreen>
);
}