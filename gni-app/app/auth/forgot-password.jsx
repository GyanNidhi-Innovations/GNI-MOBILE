import { useState , useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput,
  Keyboard,
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
  const [
  loadingAction,
  setLoadingAction,
] = useState(null);

const loading =
  loadingAction !== null;

  const requestLockedRef =
  useRef(false);

  const [emailError, setEmailError] = useState("");

const [otpError, setOtpError] = useState("");

const [formError, setFormError] = useState("");

const [infoMessage, setInfoMessage] = useState("");
 
  const normalizedEmail =
    email.trim().toLowerCase();

  const isValidEmail = () =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalizedEmail,
    );

const handleSendCode = async () => {
  if (
    loading ||
    requestLockedRef.current
  ) {
    return;
  }

  setEmailError("");
  setFormError("");
  setInfoMessage("");

  if (!normalizedEmail) {
    setEmailError(
      "Email is required",
    );
    return;
  }

  if (!isValidEmail()) {
    setEmailError(
      "Enter a valid email address",
    );
    return;
  }

  /*
 * Email is valid.
 * Close the keyboard before starting
 * the network request.
 */
  Keyboard.dismiss();

  requestLockedRef.current = true;

  try {
    setLoadingAction("send");

    await requestResetOtpApi({
      email: normalizedEmail,
    });

    setOtp("");
    setOtpError("");
    setFormError("");
    setInfoMessage("");
    setStep("otp");
  } catch (error) {
    setFormError(
      "Unable to send the verification code. Please try again.",
    );
  } finally {
    requestLockedRef.current = false;
    setLoadingAction(null);
  }
};

const handleVerifyCode = async () => {
  if (
    loading ||
    requestLockedRef.current
  ) {
    return;
  }

  setOtpError("");
  setFormError("");
  setInfoMessage("");

  if (!otp) {
    setOtpError(
      "Verification code is required",
    );
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
  setOtpError(
    "Enter the 6-digit verification code",
  );
  return;
}

/*
 * OTP is valid format.
 * Close numeric keyboard before
 * verification starts.
 */
Keyboard.dismiss();

requestLockedRef.current = true;

  try {
    setLoadingAction("verify");

    const response =
      await verifyResetOtpApi({
        email: normalizedEmail,
        otp,
      });

    if (!response?.resetToken) {
      setFormError(
        "Unable to verify the code. Please try again.",
      );
      return;
    }

    router.replace({
      pathname:
        "/auth/reset-password",

      params: {
        token:
          response.resetToken,
      },
    });
  } catch (error) {
    setOtpError(
      "The verification code is invalid or expired",
    );
  } finally {
    requestLockedRef.current = false;
    setLoadingAction(null);
  }
};

 const handleResendCode = async () => {
  if (
    loading ||
    requestLockedRef.current
  ) {
    return;
  }

  requestLockedRef.current = true;

  setOtpError("");
  setFormError("");
  setInfoMessage("");

  try {
    setLoadingAction("resend");

    await requestResetOtpApi({
      email: normalizedEmail,
    });

    setOtp("");

    setInfoMessage(
      "A new verification code was sent to your email.",
    );
  } catch (error) {
    setFormError(
      "Please wait one minute before requesting another code.",
    );
  } finally {
    requestLockedRef.current = false;
    setLoadingAction(null);
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

              setEmailError("");
              setOtpError("");
              setFormError("");
              setInfoMessage("");
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
            If registered, a code will be sent to{" "}
             {normalizedEmail}.
          </Text>

          <TextInput
  value={otp}
  onChangeText={(value) => {
    setOtp(
      value
        .replace(/\D/g, "")
        .slice(0, 6),
    );

    if (otpError) {
      setOtpError("");
    }

    if (formError) {
      setFormError("");
    }

    if (infoMessage) {
      setInfoMessage("");
    }
  }}
  placeholder="Enter code"
  placeholderTextColor="#98A2B3"
  keyboardType="number-pad"
  returnKeyType="done"
  onSubmitEditing={
    handleVerifyCode
  }
  maxLength={6}


            style={{
  height: 56,
  marginTop: SPACING.xxl,
  paddingHorizontal: SPACING.lg,
  borderWidth: 1,
  borderColor:
  otpError
    ? "#D92D20"
    : "#D0D5DD",
  borderRadius: RADIUS.xl,
  backgroundColor: "#F9FAFB",
  color: "#101828",
  fontSize: 16,
  fontWeight: "500",
  textAlign: "left",
}}
          />

          {otpError ? (
  <View
    style={{
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
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
      {otpError}
    </Text>
  </View>
) : null}

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
  style={{
    flexDirection: "row",
    alignItems: "center",
  }}
>
  {loadingAction === "resend" ? (
    <>
      <ActivityIndicator
        size="small"
        color="#0F5EFF"
      />

      <Text
        style={{
          marginLeft: 6,
          color: "#0F5EFF",
          fontSize: 14,
          lineHeight: 21,
          fontWeight: "700",
        }}
      >
        Sending...
      </Text>
    </>
  ) : (
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
  )}
</Pressable>
          </View>


          {infoMessage ? (
  <View
    style={{
      marginTop: SPACING.lg,
      borderRadius: 12,
      backgroundColor: "#ECFDF3",
      paddingHorizontal: 14,
      paddingVertical: 11,
      flexDirection: "row",
      alignItems: "center",
    }}
  >
    <Ionicons
      name="checkmark-circle-outline"
      size={18}
      color="#027A48"
    />

    <Text
      style={{
        flex: 1,
        marginLeft: 8,
        color: "#027A48",
        fontSize: 13,
        lineHeight: 19,
        fontWeight: "600",
      }}
    >
      {infoMessage}
    </Text>
  </View>
) : null}

{formError ? (
  <View
    style={{
      marginTop: SPACING.lg,
      borderRadius: 12,
      backgroundColor: "#FEF3F2",
      paddingHorizontal: 14,
      paddingVertical: 11,
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
      {formError}
    </Text>
  </View>
) : null}



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
      {loadingAction === "verify" ? (
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
            router.navigate("/auth/login")
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
  onChangeText={(value) => {
    setEmail(value);

    if (emailError) {
      setEmailError("");
    }

    if (formError) {
      setFormError("");
    }
  }}
  keyboardType="email-address"
autoCapitalize="none"
autoCorrect={false}
returnKeyType="send"
onSubmitEditing={
  handleSendCode
}
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


{formError ? (
  <View
    style={{
      marginBottom: SPACING.lg,
      borderRadius: 12,
      backgroundColor: "#FEF3F2",
      paddingHorizontal: 14,
      paddingVertical: 11,
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
      {formError}
    </Text>
  </View>
) : null}



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
      {loadingAction === "send" ? (
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