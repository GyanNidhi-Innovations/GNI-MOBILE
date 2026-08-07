import NotificationToken from "../models/NotificationToken.js";
import { admin } from "../config/firebaseAdmin.js";

const INVALID_REGISTRATION_CODES =
  new Set([
    "messaging/registration-token-not-registered",
    "messaging/invalid-registration-token",
  ]);

function convertDataValue(value) {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return JSON.stringify(value);
}

/*
 * FCM requires every value in data to be a
 * string.
 */
export function stringifyNotificationData(
  data = {},
) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(
        ([, value]) =>
          value !== undefined &&
          value !== null,
      )
      .map(([key, value]) => [
        key,
        convertDataValue(value),
      ]),
  );
}

/*
 * Defensive deduplication. The same Firebase
 * registration token is targeted only once.
 */
export function dedupeDeviceRecords(
  records = [],
) {
  const devicesByToken =
    new Map();

  for (const record of records) {
    if (!record?.token) continue;

    devicesByToken.set(
      String(record.token),
      record,
    );
  }

  return [
    ...devicesByToken.values(),
  ];
}

/*
 * Returns each user only once, irrespective of
 * how many active installations that user owns.
 */
export function uniqueUserIdsFromDevices(
  deviceRecords = [],
) {
  return [
    ...new Set(
      deviceRecords
        .map((record) =>
          record?.userId
            ? String(
                record.userId,
              )
            : null,
        )
        .filter(Boolean),
    ),
  ];
}

/*
 * Converts device-level Firebase responses into
 * user-level summaries.
 */
export function buildUserDeliveryMap(
  deliveryResults = [],
) {
  const resultByUser =
    new Map();

  for (const result of deliveryResults) {
    const userId =
      String(
        result.userId || "",
      );

    if (!userId) continue;

    if (
      !resultByUser.has(userId)
    ) {
      resultByUser.set(
        userId,
        {
          successCount: 0,
          failureCount: 0,
          errors: [],
        },
      );
    }

    const userResult =
      resultByUser.get(userId);

    if (result.success) {
      userResult.successCount += 1;
    } else {
      userResult.failureCount += 1;

      if (result.errorCode) {
        userResult.errors.push(
          result.errorCode,
        );
      }
    }
  }

  return resultByUser;
}

/*
 * Sends the same push payload to each unique
 * active device token.
 *
 * Firebase permits up to 500 targets per
 * multicast request. The returned response list
 * corresponds to the order of the supplied
 * tokens, which lets us persist exact per-device
 * FCM acceptance or rejection.
 */
export async function sendPushToDeviceRecords({
  deviceRecords,
  title,
  body,
  data = {},
  imageUrl = "",
}) {
  const uniqueDevices =
    dedupeDeviceRecords(
      deviceRecords,
    );

  if (
    uniqueDevices.length === 0
  ) {
    return {
      uniqueDevices: [],
      results: [],
      successCount: 0,
      failureCount: 0,
      invalidTokensDisabled: 0,
    };
  }

  const stringData =
    stringifyNotificationData(
      data,
    );

  const results = [];
  const invalidTokens = [];

  for (
    let start = 0;
    start <
    uniqueDevices.length;
    start += 500
  ) {
    const batch =
      uniqueDevices.slice(
        start,
        start + 500,
      );

    const tokenValues =
      batch.map(
        (device) =>
          device.token,
      );

    const response =
      await admin
        .messaging()
        .sendEachForMulticast({
          tokens:
            tokenValues,

          notification: {
            title,
            body,

            ...(imageUrl
              ? {
                  imageUrl,
                }
              : {}),
          },

          data:
            stringData,

          android: {
            priority:
              "high",

            notification: {
              channelId:
                "default",

              sound:
                "default",

              ...(imageUrl
                ? {
                    imageUrl,
                  }
                : {}),
            },
          },

          apns: {
            payload: {
              aps: {
                sound:
                  "default",
              },
            },
          },
        });

    response.responses.forEach(
      (
        firebaseResult,
        index,
      ) => {
        const device =
          batch[index];

        const errorCode =
          firebaseResult
            .error?.code ||
          "";

        results.push({
          userId:
            String(
              device.userId ||
                "",
            ),

          installationId:
            String(
              device.installationId ||
                `legacy-${String(
                  device.token || "",
                ).slice(-10)}`,
            ),

          deviceName:
            String(
              device.deviceName ||
                "",
            ),

          platform:
            [
              "android",
              "ios",
              "unknown",
            ].includes(
              device.platform,
            )
              ? device.platform
              : "unknown",

          token:
            device.token,

          tokenSuffix:
            String(
              device.token ||
                "",
            ).slice(-10),

          success:
            firebaseResult
              .success,

          messageId:
            firebaseResult
              .messageId ||
            "",

          errorCode,

          errorMessage:
            firebaseResult
              .error?.message ||
            "",
        });

        if (
          !firebaseResult
            .success &&
          INVALID_REGISTRATION_CODES.has(
            errorCode,
          )
        ) {
          invalidTokens.push(
            device.token,
          );
        }
      },
    );
  }

  if (
    invalidTokens.length > 0
  ) {
    await NotificationToken
      .updateMany(
        {
          token: {
            $in:
              invalidTokens,
          },
        },
        {
          $set: {
            isActive:
              false,

            lastFailedAt:
              new Date(),

            failureReason:
              "Firebase registration is invalid or unregistered",
          },
        },
      );
  }

  return {
    uniqueDevices,
    results,

    successCount:
      results.filter(
        (result) =>
          result.success,
      ).length,

    failureCount:
      results.filter(
        (result) =>
          !result.success,
      ).length,

    invalidTokensDisabled:
      invalidTokens.length,
  };
}
