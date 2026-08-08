import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { apiClient } from "./apiClient";

const INSTALLATION_ID_KEY =
  "gniNotificationInstallationId";

const FCM_RECOVERY_KEY =
  "gniFcmRecovery20260722";


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
  

  if (!userId || !nativeToken) {
    throw new Error(
      "userId and nativeToken are required",
    );
  }

  const installationId =
    await getOrCreateInstallationId();


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


    return {
      installationId,
      nativeToken,
      response,
    };
  } catch (error) {
      if (__DEV__) {
  console.warn(
    "Notification token registration failed:",
    error?.message || error,
  );
}

    throw error;
  }
}

export async function registerForFcmNotifications(
  userId,
) {
 

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

 

  let permission =
    await Notifications.getPermissionsAsync();


  if (permission.status !== "granted") {
    permission =
      await Notifications.requestPermissionsAsync();

  }

  if (permission.status !== "granted") {
    throw new Error(
      "Notification permission was not granted",
    );
  }



let tokenResponse;

const recoveryAlreadyAttempted =
  await SecureStore.getItemAsync(
    FCM_RECOVERY_KEY,
  );

if (!recoveryAlreadyAttempted) {
 

  await Notifications
    .unregisterForNotificationsAsync();


  await new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });

  tokenResponse =
    await Notifications
      .getDevicePushTokenAsync();

 

  await SecureStore.setItemAsync(
    FCM_RECOVERY_KEY,
    "attempted",
  );
} else {
  

  tokenResponse =
    await Notifications
      .getDevicePushTokenAsync();
}

const nativeToken =
  tokenResponse?.data;



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
          if (__DEV__) {
          console.warn(
            "Push token refresh registration failed:",
            error?.message || error,
          );
        }
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

export async function markNotificationCampaignOpened(
  campaignId,
) {
  const cleanCampaignId = String(
    campaignId || "",
  ).trim();

  if (!cleanCampaignId) {
    return {
      success: true,
      tracked: false,
      reason: "No campaign id was supplied",
    };
  }

  return await apiClient(
    `/notifications/campaigns/${encodeURIComponent(
      cleanCampaignId,
    )}/opened`,
    {
      method: "PATCH",
    },
  );
}
