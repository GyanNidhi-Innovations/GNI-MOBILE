import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Linking, AppState } from "react-native";
import * as Notifications from "expo-notifications";

export default function NotificationPermissionGate({ children }) {
  const [allowed, setAllowed] = useState(null);

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
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-2xl font-bold text-center text-gray-900">
          Enable Notifications
        </Text>

        <Text className="mt-4 text-base text-center text-gray-600">
          Notifications are required so you do not miss event updates,
          registration deadlines, drive alerts, and reminders.
        </Text>

        <TouchableOpacity
          onPress={requestPermission}
          className="mt-8 w-full rounded-xl bg-blue-600 py-4"
        >
          <Text className="text-center text-white font-semibold">
            Allow Notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          className="mt-4 w-full rounded-xl border border-gray-300 py-4"
        >
          <Text className="text-center text-gray-800 font-semibold">
            Open Settings
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return children;
}