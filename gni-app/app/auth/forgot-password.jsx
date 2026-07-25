import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import AppScreen from "../../src/components/common/AppScreen";
import AppInput from "../../src/components/ui/AppInput";

import {
  requestResetOtpApi,
  verifyResetOtpApi,
} from "../../src/services/authService";

import {
  SPACING,
  RADIUS,
} from "../../src/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);

  const normalizedEmail =
    email.trim().toLowerCase();

  const isValidEmail = () =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalizedEmail,
    );

  const handleSendCode = async () => {
    if (!normalizedEmail) {
      Alert.alert(
        "Email required",
        "Enter your registered email address.",
      );
      return;
    }

    if (!isValidEmail()) {
      Alert.alert(
        "Invalid email",
        "Enter a valid email address.",
      );
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      await requestResetOtpApi({
        email: normalizedEmail,
      });

      setOtp("");
      setStep("otp");
    } catch (error) {
      Alert.alert(
        "Unable to send code",
        error?.message ||
          "The verification code could not be sent.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert(
        "Invalid code",
        "Enter the 6-digit code sent to your email.",
      );
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      const response = await verifyResetOtpApi({
        email: normalizedEmail,
        otp,
      });

      if (!response?.resetToken) {
        throw new Error(
          "Reset token was not returned by the server.",
        );
      }

      router.replace({
        pathname: "/auth/reset-password",
        params: {
          token: response.resetToken,
        },
      });
    } catch (error) {
      Alert.alert(
        "Verification failed",
        error?.message ||
          "The verification code is invalid or expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (loading) return;

    try {
      setLoading(true);

      await requestResetOtpApi({
        email: normalizedEmail,
      });

      setOtp("");

      Alert.alert(
        "Code sent",
        "A new verification code was sent to your email.",
      );
    } catch (error) {
      Alert.alert(
        "Unable to resend",
        error?.message ||
          "Please wait and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <AppScreen maxWidth={560}>
        <View>
          <Pressable
            onPress={() => {
              setStep("email");
              setOtp("");
            }}
            style={{
              alignSelf: "flex-start",
              paddingVertical: 8,
              paddingTop: SPACING.lg,
              paddingRight: 16,
            }}
          >
            <Ionicons
              name="arrow-back"
              size={28}
              color="#101828"
            />
          </Pressable>

          <Text
            style={{
              marginTop: SPACING.xl,
              color: "#101828",
              fontSize: 30,
              lineHeight: 38,
              fontWeight: "800",
            }}
          >
            Check your email
          </Text>

          <Text
            style={{
              marginTop: SPACING.sm,
              color: "#667085",
              fontSize: 15,
              lineHeight: 23,
            }}
          >
            We sent a 6-digit code to{" "}
            {normalizedEmail}. Enter the code to
            continue.
          </Text>

          <TextInput
            value={otp}
            onChangeText={(value) =>
              setOtp(
                value
                  .replace(/\D/g, "")
                  .slice(0, 6),
              )
            }
            placeholder="Enter code"
            placeholderTextColor="#98A2B3"
            keyboardType="number-pad"
            maxLength={6}
            style={{
  height: 56,
  marginTop: SPACING.xxl,
  paddingHorizontal: SPACING.lg,
  borderWidth: 1,
  borderColor: "#D0D5DD",
  borderRadius: RADIUS.xl,
  backgroundColor: "#F9FAFB",
  color: "#101828",
  fontSize: 16,
  fontWeight: "500",
  textAlign: "left",
}}
          />

          <View
            style={{
              marginTop: SPACING.lg,
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="refresh-outline"
              size={22}
              color="#344054"
            />

            <Text
              style={{
                marginLeft: 8,
                color: "#344054",
                fontSize: 14,
                lineHeight: 21,
              }}
            >
              It may take a few minutes.{" "}
            </Text>

            <Pressable
              disabled={loading}
              onPress={handleResendCode}
            >
              <Text
                style={{
                  color: "#0F5EFF",
                  fontSize: 14,
                  lineHeight: 21,
                  fontWeight: "700",
                }}
              >
                Get a new code
              </Text>
            </Pressable>
          </View>

          <View
  style={{
    width: "100%",
    marginTop: SPACING.xxl,
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
      onPress={handleVerifyCode}
      style={({ pressed }) => ({
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        opacity:
          pressed && !loading ? 0.85 : 1,
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
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
          />
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
          Continue
        </Text>
      )}
    </Pressable>
  </View>
</View>

     </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen  maxWidth={560}>
      <View>
        <Pressable
          onPress={() =>
            router.replace("/auth/login")
          }
          style={{
            alignSelf: "flex-start",
            paddingVertical: 8,
            paddingTop: SPACING.lg,
            paddingRight: 16,
          }}
        >
          <Ionicons
            name="arrow-back"
            size={28}
            color="#101828"
          />
        </Pressable>

        <Text
          style={{
            marginTop: SPACING.xl,
            color: "#101828",
            fontSize: 30,
            lineHeight: 38,
            fontWeight: "800",
          }}
        >
          Forgot password?
        </Text>

        <Text
          style={{
            marginTop: SPACING.sm,
            marginBottom: SPACING.xxl,
            color: "#667085",
            fontSize: 15,
            lineHeight: 23,
          }}
        >
          Enter your registered email address.
          We will send you a verification code.
        </Text>

        <AppInput
          label="Email"
          icon="mail-outline"
          placeholder="youremail@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            marginBottom: SPACING.xl,
          }}
        />

        <View
  style={{
    width: "100%",
    // marginTop: SPACING.xl,
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
      onPress={handleSendCode}
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
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
          />
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
          Send code
        </Text>
      )}
    </Pressable>
  </View>
</View>
      </View>
    </AppScreen>
  );
}