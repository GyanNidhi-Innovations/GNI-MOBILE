import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Linking, AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme";

export default function NotificationPermissionGate({ children }) {
  const [allowed, setAllowed] = useState(null);
  const insets = useSafeAreaInsets();

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setAllowed(status === "granted");
  };

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setAllowed(status === "granted");
  };

  useEffect(() => {
    checkPermission();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkPermission();
      }
    });

    return () => sub.remove();
  }, []);

  if (allowed === null) return null;

  if (!allowed) {
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: SPACING.xl,
            paddingTop: SPACING.xl + insets.top,
            paddingBottom: SPACING.xl + insets.bottom,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 520,
              alignSelf: "center",
              backgroundColor: COLORS.white,
              borderRadius: RADIUS.xxxl || 32,
              padding: SPACING.xl,
            }}
          >
            <Text
              style={{
                fontSize: 26,
                fontWeight: "800",
                textAlign: "center",
                color: COLORS.text,
              }}
            >
              Enable Notifications
            </Text>

            <Text
              style={{
                marginTop: SPACING.md,
                fontSize: TYPOGRAPHY.body || 15,
                lineHeight: 23,
                textAlign: "center",
                color: COLORS.textSecondary,
              }}
            >
              Notifications are required so you do not miss event updates,
              registration deadlines, drive alerts, and reminders.
            </Text>

            <Pressable
              onPress={requestPermission}
              style={{
                marginTop: SPACING.xl,
                minHeight: 56,
                borderRadius: RADIUS.xl,
                backgroundColor: COLORS.primary,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: SPACING.lg,
              }}
            >
              <Text
                style={{
                  color: COLORS.white,
                  fontWeight: "700",
                  fontSize: TYPOGRAPHY.button || 15,
                  textAlign: "center",
                }}
              >
                Allow Notifications
              </Text>
            </Pressable>

            <Pressable
              onPress={() => Linking.openSettings()}
              style={{
                marginTop: SPACING.md,
                minHeight: 56,
                borderRadius: RADIUS.xl,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.white,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: SPACING.lg,
              }}
            >
              <Text
                style={{
                  color: COLORS.text,
                  fontWeight: "700",
                  fontSize: TYPOGRAPHY.button || 15,
                  textAlign: "center",
                }}
              >
                Open Settings
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return children;
}