import { useState , useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Keyboard,
} from "react-native";
import { router } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import * as Notifications from "expo-notifications";

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
  
  const { height } =
  useWindowDimensions();

const signupSupportGap =
  height < 700
    ? 10
    : height < 800
      ? 20
      : 60;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const requestLockedRef = useRef(false);

  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");

const [passwordError, setPasswordError] = useState("");

const [loginError, setLoginError] = useState("");

  const setAuth = useAuthStore((state) => state.setAuth);

const handleLogin = async () => {
  if (
    loading ||
    requestLockedRef.current
  ) {
    return;
  }

  const cleanEmail =
    email.trim().toLowerCase();

  const cleanPassword =
    password.trim();

  setEmailError("");
  setPasswordError("");
  setLoginError("");

  let hasError = false;

  if (!cleanEmail) {
    setEmailError(
      "Email is required",
    );

    hasError = true;
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      cleanEmail,
    )
  ) {
    setEmailError(
      "Enter a valid email address",
    );

    hasError = true;
  }

  if (!cleanPassword) {
    setPasswordError(
      "Password is required",
    );

    hasError = true;
  }

  /*
   * Keep keyboard open when
   * validation fails so the user
   * can immediately correct it.
   */
  if (hasError) {
    return;
  }

  /*
   * Email and password passed
   * local validation.
   */
  Keyboard.dismiss();

  /*
   * Prevent rapid double login
   * requests immediately.
   */
  requestLockedRef.current = true;

  try {
    setLoading(true);

    const response =
      await loginUserApi({
        email: cleanEmail,
        password: cleanPassword,
      });

    if (!response?.success) {
      setLoginError(
        "Invalid email or password",
      );

      return;
    }

    if (
      !response?.user ||
      !response?.accessToken ||
      !response?.refreshToken
    ) {
      setLoginError(
        "Unable to sign in. Please try again.",
      );

      return;
    }

    Notifications
      .clearLastNotificationResponse();

    await setAuth({
      user: response.user,

      accessToken:
        response.accessToken,

      refreshToken:
        response.refreshToken,
    });

    router.replace(
      "/(protected)/home",
    );
  } catch (error) {
    const message =
      String(
        error?.response?.data
          ?.message ||
          error?.message ||
          "",
      ).toLowerCase();

    if (
      message.includes(
        "invalid credentials",
      ) ||
      message.includes(
        "invalid email or password",
      )
    ) {
      setLoginError(
        "Invalid email or password",
      );
    } else {
      setLoginError(
        "Unable to sign in. Please try again.",
      );
    }
  } finally {
    requestLockedRef.current = false;
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
  onChangeText={(value) => {
    setEmail(value);

    if (emailError) {
      setEmailError("");
    }

    if (loginError) {
      setLoginError("");
    }
  }}
  keyboardType="email-address"
  autoCapitalize="none"
  returnKeyType="next"
  blurOnSubmit={false}
  style={{
    marginBottom:
      emailError ? 6 : SPACING.xl,
  }}
/>

{emailError ? (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.lg,
    }}
  >
    <Ionicons
      name="alert-circle-outline"
      size={16}
      color="#D92D20"
    />

    <Text
      style={{
        marginLeft: 6,
        color: "#D92D20",
        fontSize: 12,
        lineHeight: 18,
      }}
    >
      {emailError}
    </Text>
  </View>
) : null}

     <AppInput
  label="Password"
  icon="lock-closed-outline"
  placeholder="Enter your password"
  value={password}
  onChangeText={(value) => {
    setPassword(value);

    if (passwordError) {
      setPasswordError("");
    }

    if (loginError) {
      setLoginError("");
    }
  }}
  secureTextEntry={!showPassword}
  returnKeyType="done"
  onSubmitEditing={handleLogin}
  rightText={
    showPassword ? "Hide" : "Show"
  }
  onRightPress={() =>
    setShowPassword(
      (previous) => !previous,
    )
  }
  style={{
    marginBottom:
      passwordError ? 6 : 0,
  }}
/>

{passwordError ? (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    }}
  >
    <Ionicons
      name="alert-circle-outline"
      size={16}
      color="#D92D20"
    />

    <Text
      style={{
        marginLeft: 6,
        color: "#D92D20",
        fontSize: 12,
        lineHeight: 18,
      }}
    >
      {passwordError}
    </Text>
  </View>
) : null}
    </View>

    {loginError ? (
  <View
    style={{
      borderRadius: 12,
      backgroundColor: "#FEF3F2",
      paddingHorizontal: 14,
      paddingVertical:11,
      flexDirection: "row",
      alignItems: "center",
    }}
  >
    <Ionicons
      name="alert-circle-outline"
      size={18}
      color="#B42318"
    />

    <Text
      style={{
        flex: 1,
        marginLeft: 8,
        color: "#B42318",
        fontSize: 13,
        lineHeight: 19,
        fontWeight: "600",
      }}
    >
      {loginError}
    </Text>
  </View>
) : null}

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
  onPress={() => router.navigate("/auth/forgot-password")}
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
  onPress={() => router.navigate("/auth/signup")}
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