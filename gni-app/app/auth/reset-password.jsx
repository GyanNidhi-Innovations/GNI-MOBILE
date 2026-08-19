import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import AppScreen from "../../src/components/common/AppScreen";
import AppInput from "../../src/components/ui/AppInput";
import {
  resetPasswordApi,
  validateResetTokenApi,
} from "../../src/services/authService";
import {
  SPACING,
  RADIUS,
} from "../../src/theme";


const validatePassword = (password) =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /\d/.test(password) &&
  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();

  const token = Array.isArray(params.token)
    ? params.token[0]
    : params.token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [checkingToken, setCheckingToken] =
    useState(true);

  const [tokenValid, setTokenValid] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

    const requestLockedRef =
  useRef(false);

const [
  passwordError,
  setPasswordError,
] = useState("");

const [
  confirmPasswordError,
  setConfirmPasswordError,
] = useState("");

const [
  formError,
  setFormError,
] = useState("");

  const [redirecting, setRedirecting] =
  useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setCheckingToken(false);
        setTokenValid(false);
        return;
      }

      try {
        await validateResetTokenApi(token);
        setTokenValid(true);
      } catch (error) {
        console.log(
          "validateResetToken error:",
          error,
        );

        setTokenValid(false);
      } finally {
        setCheckingToken(false);
      }
    };

    validateToken();
  }, [token]);

 const handleResetPassword =
  async () => {
    if (
      loading ||
      requestLockedRef.current
    ) {
      return;
    }

    setPasswordError("");
    setConfirmPasswordError("");
    setFormError("");

    let hasError = false;

    if (!password) {
      setPasswordError(
        "New password is required",
      );

      hasError = true;
    } else if (
      !validatePassword(password)
    ) {
      setPasswordError(
        "Use at least 8 characters with uppercase, lowercase, number and special character",
      );

      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(
        "Confirm your new password",
      );

      hasError = true;
    } else if (
      password &&
      password !== confirmPassword
    ) {
      setConfirmPasswordError(
        "Passwords do not match",
      );

      hasError = true;
    }

    if (hasError) {
      return;
    }

    if (!token) {
      setFormError(
        "This reset session is invalid or expired.",
      );
      return;
    }

    /*
     * Validation passed.
     * Close the keyboard before
     * starting the request.
     */
    Keyboard.dismiss();

    requestLockedRef.current = true;

    try {
      setLoading(true);

      await resetPasswordApi({
        token,
        password,
      });

      setCompleted(true);

      setTimeout(() => {
        setRedirecting(true);

        setTimeout(() => {
          router.replace(
            "/auth/login",
          );
        }, 1000);
      }, 2000);
    } catch (error) {
      setFormError(
        error?.message ||
          "Unable to reset your password. Please try again.",
      );
    } finally {
      requestLockedRef.current =
        false;

      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <AppScreen
        centered
        scroll={false}
        maxWidth={560}
      >
        <ActivityIndicator
          size="small"
          color="#0F5EFF"
        />
      </AppScreen>
    );
  }

  if (!tokenValid) {
    return (
      <AppScreen
  maxWidth={560}
  contentStyle={{
    paddingTop: SPACING.lg,
  }}
>
        <View
          style={{
            alignItems: "center",
            paddingVertical: SPACING.xxl,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FEF3F2",
            }}
          >
            <Ionicons
              name="alert-circle-outline"
              size={38}
              color="#D92D20"
            />
          </View>

          <Text
            style={{
              marginTop: SPACING.xl,
              color: "#101828",
              fontSize: 24,
              lineHeight: 30,
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            Invalid or expired link
          </Text>

          <Text
            style={{
              marginTop: SPACING.sm,
              color: "#667085",
              fontSize: 14,
              lineHeight: 22,
              textAlign: "center",
            }}
          >
            This password reset link is invalid or has
            expired. Request a new reset link.
          </Text>

          <Pressable
            onPress={() =>
              router.replace(
                "/auth/forgot-password",
              )
            }
            style={({ pressed }) => ({
              width: "100%",
              height: 50,
              marginTop: SPACING.xxl,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              backgroundColor: "#0F5EFF",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Request new link
            </Text>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  if (completed) {
    return (
      <AppScreen
  maxWidth={560}
  contentStyle={{
    paddingTop: SPACING.lg,
  }}
>
        <View
          style={{
            alignItems: "center",
            paddingVertical: SPACING.xxl,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ECFDF3",
            }}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={38}
              color="#039855"
            />
          </View>

          <Text
            style={{
              marginTop: SPACING.xl,
              color: "#101828",
              fontSize: 24,
              lineHeight: 30,
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            Password reset
          </Text>

          <Text
            style={{
              marginTop: SPACING.sm,
              color: "#667085",
              fontSize: 14,
              lineHeight: 22,
              textAlign: "center",
            }}
          >
            Your password has been updated successfully.
           
          </Text>

          {redirecting && (
  <View
    style={{
      marginTop: SPACING.lg,
      alignItems: "center",
    }}
  >
    <ActivityIndicator
      size="small"
      color="#0F5EFF"
    />

    <Text
      style={{
        marginTop: SPACING.sm,
        color: "#667085",
        fontSize: 13,
      }}
    >
      Redirecting to login...
    </Text>
  </View>
)}

          {/* <Pressable
            onPress={() =>
              router.replace("/auth/login")
            }
            style={({ pressed }) => ({
              width: "100%",
              height: 50,
              marginTop: SPACING.xxl,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              backgroundColor: "#0F5EFF",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Sign in
            </Text>
          </Pressable> */}
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen
  maxWidth={560}
  contentStyle={{
    paddingTop: SPACING.lg,
  }}
>
  
      <Pressable
        onPress={() =>
          router.replace("/auth/login")
        }
        style={{
          alignSelf: "flex-start",
          paddingVertical: 8,
          paddingRight: 12,
          marginBottom: SPACING.xl,
        }}
      >
        <Ionicons
          name="arrow-back"
          size={24}
          color="#344054"
        />
      </Pressable>

      <View
        style={{
          marginBottom: SPACING.xxl,
        }}
      >
        <Text
          style={{
            color: "#101828",
            fontSize: 28,
            lineHeight: 34,
            fontWeight: "800",
          }}
        >
          Reset password
        </Text>

        <Text
          style={{
            marginTop: SPACING.sm,
            color: "#667085",
            fontSize: 15,
            lineHeight: 23,
          }}
        >
          Create a new secure password for your account.
        </Text>
      </View>

      <View
        style={{
          paddingVertical: SPACING.lg,
          borderRadius: RADIUS.xl,
          backgroundColor: "#FFFFFF",
        }}
      >
        <AppInput
  label="New Password"
  icon="lock-closed-outline"
  placeholder="Enter new password"
  value={password}
  onChangeText={(value) => {
    setPassword(value);

    if (passwordError) {
      setPasswordError("");
    }

    if (formError) {
      setFormError("");
    }
  }}
  secureTextEntry={!showPassword}
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
      passwordError
        ? 6
        : SPACING.xl,
  }}
/>

{passwordError ? (
  <View
    style={{
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: SPACING.lg,
    }}
  >
    <Ionicons
      name="alert-circle-outline"
      size={16}
      color="#D92D20"
      style={{
        marginTop: 1,
      }}
    />

    <Text
      style={{
        flex: 1,
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

        <AppInput
  label="Confirm Password"
  icon="shield-checkmark-outline"
  placeholder="Confirm new password"
  value={confirmPassword}
  onChangeText={(value) => {
    setConfirmPassword(value);

    if (confirmPasswordError) {
      setConfirmPasswordError("");
    }

    if (formError) {
      setFormError("");
    }
  }}
  secureTextEntry={
    !showConfirmPassword
  }
  rightText={
    showConfirmPassword
      ? "Hide"
      : "Show"
  }
  onRightPress={() =>
    setShowConfirmPassword(
      (previous) => !previous,
    )
  }
  returnKeyType="done"
  onSubmitEditing={
    handleResetPassword
  }
  style={{
    marginBottom:
      confirmPasswordError
        ? 6
        : 0,
  }}
/>

{confirmPasswordError ? (
  <View
    style={{
      marginTop: 4,
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
      {confirmPasswordError}
    </Text>
  </View>
) : null}

      </View>

      <Text
        style={{
          marginTop: SPACING.md,
          color: "#667085",
          fontSize: 12,
          lineHeight: 18,
        }}
      >
        Use at least 8 characters with uppercase,
        lowercase, number and special character.
      </Text>

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
    marginTop: SPACING.xl,
  }}
>
  <View
    style={{
      width: "100%",
      height: 50,
      backgroundColor: "#0F5EFF",
      borderRadius: 14,
      overflow: "hidden",
    }}
  >
    <Pressable
      disabled={loading}
      onPress={handleResetPassword}
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
          Reset password
        </Text>
      )}
    </Pressable>
  </View>
</View>

    </AppScreen>
  );
}