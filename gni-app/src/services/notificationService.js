import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { apiClient } from "./apiClient";


const INSTALLATION_ID_KEY =
  "gniNotificationInstallationId";


const FCM_RECOVERY_KEY =
  "gniFcmRecovery20260722";

  console.log(
  "[PUSH-DEBUG][MOBILE] notificationService module loaded",
  {
    installationKey:
      INSTALLATION_ID_KEY,

    recoveryKey:
      FCM_RECOVERY_KEY,
  },
);


  function summarizeToken(token) {
  const value = String(token || "");

  return {
    exists: Boolean(value),
    length: value.length,
    first10: value.slice(0, 10),
    last10: value.slice(-10),
  };
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function createInstallationId() {
  /*
   * Use the runtime UUID implementation when
   * available.
   */
  if (
    typeof globalThis.crypto
      ?.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  /*
   * Fallback without adding another native
   * dependency. This identifier is not a secret;
   * it only needs to be unique per installation.
   */
  return [
    "gni",
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2),
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-");
}

let installationIdPromise = null;

export async function getOrCreateInstallationId() {
  if (installationIdPromise) {
    return installationIdPromise;
  }

  installationIdPromise = (async () => {
    const existing =
      await SecureStore.getItemAsync(
        INSTALLATION_ID_KEY,
      );

    if (existing) {
      return existing;
    }

    const installationId =
      createInstallationId();

    await SecureStore.setItemAsync(
      INSTALLATION_ID_KEY,
      installationId,
    );

    return installationId;
  })();

  try {
    return await installationIdPromise;
  } finally {
    installationIdPromise = null;
  }
}

async function registerNativeToken({
  userId,
  nativeToken,
}) {
  console.log(
    "[PUSH-DEBUG][MOBILE] registerNativeToken started",
    {
      userId,
      token: summarizeToken(nativeToken),
      platform: Platform.OS,
    },
  );

  if (!userId || !nativeToken) {
    throw new Error(
      "userId and nativeToken are required",
    );
  }

  const installationId =
    await getOrCreateInstallationId();

  console.log(
    "[PUSH-DEBUG][MOBILE] Registering token with backend",
    {
      userId,
      installationId,
      token: summarizeToken(nativeToken),
      platform: Platform.OS,
      deviceName:
        Device.deviceName ||
        Device.modelName ||
        "",
    },
  );

  try {
    const response = await apiClient(
      "/notifications/register-token",
      {
        method: "POST",

        body: JSON.stringify({
          userId,
          installationId,
          token: nativeToken,

          platform:
            Platform.OS === "android"
              ? "android"
              : Platform.OS === "ios"
                ? "ios"
                : "unknown",

          deviceName:
            Device.deviceName ||
            Device.modelName ||
            "",
        }),
      },
    );

    console.log(
      "[PUSH-DEBUG][MOBILE] Registration API succeeded",
      {
        success: response?.success,
        message: response?.message,
        deviceId: response?.device?._id,
        savedUserId:
          response?.device?.userId,
        savedInstallationId:
          response?.device?.installationId,
        isActive:
          response?.device?.isActive,
        failureReason:
          response?.device?.failureReason,
        savedToken: summarizeToken(
          response?.device?.token,
        ),
      },
    );

    return {
      installationId,
      nativeToken,
      response,
    };
  } catch (error) {
    console.log(
      "[PUSH-DEBUG][MOBILE] Registration API failed",
      {
        message:
          error?.message || String(error),
        userId,
        installationId,
        token: summarizeToken(nativeToken),
      },
    );

    throw error;
  }
}

export async function registerForFcmNotifications(
  userId,
) {
  console.log(
    "[PUSH-DEBUG][MOBILE] FCM registration started",
    {
      userId,
      hasUserId: Boolean(userId),
      isPhysicalDevice: Device.isDevice,
      platform: Platform.OS,
      deviceName: Device.deviceName,
      modelName: Device.modelName,
    },
  );

  if (!userId) {
    throw new Error(
      "User ID is required for notification registration",
    );
  }

  if (!Device.isDevice) {
    throw new Error(
      "Push notifications require a real device",
    );
  }

  await Notifications.setNotificationChannelAsync(
    "default",
    {
      name: "General Notifications",
      importance:
        Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [
        0,
        250,
        250,
        250,
      ],
    },
  );

  console.log(
    "[PUSH-DEBUG][MOBILE] Android channel ready",
  );

  let permission =
    await Notifications.getPermissionsAsync();

  console.log(
    "[PUSH-DEBUG][MOBILE] Existing permission",
    {
      status: permission?.status,
      granted: permission?.granted,
      canAskAgain:
        permission?.canAskAgain,
    },
  );

  if (permission.status !== "granted") {
    permission =
      await Notifications.requestPermissionsAsync();

    console.log(
      "[PUSH-DEBUG][MOBILE] Permission request result",
      {
        status: permission?.status,
        granted: permission?.granted,
        canAskAgain:
          permission?.canAskAgain,
      },
    );
  }

  if (permission.status !== "granted") {
    throw new Error(
      "Notification permission was not granted",
    );
  }

  console.log(
  "[PUSH-DEBUG][MOBILE] Requesting native FCM token",
);

let tokenResponse;

const recoveryAlreadyAttempted =
  await SecureStore.getItemAsync(
    FCM_RECOVERY_KEY,
  );

if (!recoveryAlreadyAttempted) {
  const tokenBeforeReset =
    await Notifications
      .getDevicePushTokenAsync()
      .catch((error) => {
        console.log(
          "[PUSH-DEBUG][MOBILE] Unable to read token before reset",
          error?.message || String(error),
        );

        return null;
      });

  console.log(
    "[PUSH-DEBUG][MOBILE] Token before recovery",
    {
      token: summarizeToken(
        tokenBeforeReset?.data,
      ),
    },
  );

  console.log(
    "[PUSH-DEBUG][MOBILE] Unregistering current FCM registration",
  );

  await Notifications
    .unregisterForNotificationsAsync();

  console.log(
    "[PUSH-DEBUG][MOBILE] FCM registration removed",
  );

  await new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });

  tokenResponse =
    await Notifications
      .getDevicePushTokenAsync();

  console.log(
    "[PUSH-DEBUG][MOBILE] Token after recovery",
    {
      token: summarizeToken(
        tokenResponse?.data,
      ),

      changed:
        tokenBeforeReset?.data !==
        tokenResponse?.data,
    },
  );

  await SecureStore.setItemAsync(
    FCM_RECOVERY_KEY,
    "attempted",
  );
} else {
  console.log(
    "[PUSH-DEBUG][MOBILE] Recovery was already attempted",
  );

  tokenResponse =
    await Notifications
      .getDevicePushTokenAsync();
}

const nativeToken =
  tokenResponse?.data;

  console.log(
    "[PUSH-DEBUG][MOBILE] Native token received",
    {
      type: tokenResponse?.type,
      token: summarizeToken(nativeToken),
    },
  );

  if (!nativeToken) {
    throw new Error(
      "Firebase device token was not returned",
    );
  }

  const result =
    await registerNativeToken({
      userId,
      nativeToken,
    });

  console.log(
    "[PUSH-DEBUG][MOBILE] FCM registration completed",
  );

  return result;
}

/*
 * Firebase can refresh a token while the
 * application is installed.
 *
 * Do not call getDevicePushTokenAsync inside this
 * listener. The refreshed token is supplied to
 * the callback.
 */
export function subscribeToPushTokenChanges(
  userId,
) {
  if (!userId) {
    return {
      remove: () => {},
    };
  }

  return Notifications.addPushTokenListener(
    (tokenResponse) => {
        const nativeToken =
          tokenResponse?.data;

        if (!nativeToken) return;

        registerNativeToken({
          userId,
          nativeToken,
        }).catch((error) => {
          console.log(
            "Push token refresh registration failed:",
            error?.message ||
              error,
          );
        });
      },
    );
}

export async function deactivateCurrentNotificationInstallation(
  userId,
) {
  if (!userId) return;

  const installationId =
    await SecureStore.getItemAsync(
      INSTALLATION_ID_KEY,
    );

  if (!installationId) return;

  await apiClient(
    "/notifications/deactivate-token",
    {
      method: "POST",

      body: JSON.stringify({
        userId,
        installationId,
      }),
    },
  );
}

export async function getUnreadNotificationCount(
  userId,
) {
  return await apiClient(
    `/notifications/unread/${userId}`,
  );
}