import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { apiClient } from "./apiClient";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForFcmNotifications(userId) {
  try {
    console.log("Starting FCM registration for user:", userId);

    if (!Device.isDevice) {
      throw new Error("Use a real device for push notifications");
    }

    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });

    const permission = await Notifications.requestPermissionsAsync();
    console.log("Permission result:", permission);

    if (permission.status !== "granted") {
      throw new Error("Notification permission not granted");
    }

    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    console.log("Raw token response:", tokenResponse);

    const nativeToken = tokenResponse?.data;

    if (!nativeToken) {
      throw new Error("Failed to get native FCM token");
    }

    console.log("Native token:", nativeToken);

    const res = await apiClient("/notifications/register-token", {
      method: "POST",
      body: JSON.stringify({
        userId,
        token: nativeToken,
        platform: Device.osName?.toLowerCase() || "unknown",
        deviceName: Device.deviceName || "",
      }),
    });

    console.log("Register token API response:", res);

    return { nativeToken, res };
  } catch (error) {
    console.log("registerForFcmNotifications error:", error);
    throw error;
  }
}