import mongoose from "mongoose";

import NotificationToken from "../models/NotificationToken.js";
import Notification from "../models/Notification.js";
import { admin } from "../config/firebaseAdmin.js";

import {
  buildUserDeliveryMap,
  dedupeDeviceRecords,
  sendPushToDeviceRecords,
  stringifyNotificationData,
  uniqueUserIdsFromDevices,
} from "../services/pushNotificationService.js";

async function updateInboxDeliveryStatuses(
  inboxDocuments,
  deliveryMap,
) {
  if (!inboxDocuments.length) return;

  const now = new Date();

  const operations =
    inboxDocuments.map((document) => {
      const userId = String(
        document.userId,
      );

      const delivery =
        deliveryMap.get(userId);

      const delivered =
        (delivery?.successCount || 0) >
        0;

      return {
        updateOne: {
          filter: {
            _id: document._id,
          },

          update: {
            $set: {
              deliveryStatus: delivered
                ? "sent"
                : "failed",

              sentAt: now,

              failureReason:
                delivered
                  ? ""
                  : (
                      delivery?.errors ||
                      []
                    ).join(", ") ||
                    "Push delivery failed",
            },
          },
        },
      };
    });

  await Notification.bulkWrite(
    operations,
  );
}

export async function registerDeviceToken(req, res) {
  try {
    const {
      userId,
      installationId,
      token,
      platform,
      deviceName,
    } = req.body;

    const cleanInstallationId = String(
      installationId || "",
    ).trim();

    const cleanToken = String(
      token || "",
    ).trim();

    const cleanPlatform = [
      "android",
      "ios",
      "unknown",
    ].includes(platform)
      ? platform
      : "unknown";

    if (
      !userId ||
      !cleanInstallationId ||
      !cleanToken
    ) {
      return res.status(400).json({
        success: false,
        message:
          "userId, installationId and token are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        userId,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    /*
     * A token and an installation each identify
     * one device-registration row.
     */
    const [tokenRecord, installationRecord] =
      await Promise.all([
        NotificationToken.findOne({
          token: cleanToken,
        }),

        NotificationToken.findOne({
          installationId:
            cleanInstallationId,
        }),
      ]);

    let record;

    if (
      tokenRecord &&
      installationRecord &&
      String(tokenRecord._id) !==
        String(installationRecord._id)
    ) {
      /*
       * Same installation has an old token row,
       * while the current token belongs to another
       * legacy/racing row.
       *
       * Keep the current-token row and remove the
       * stale installation row.
       */
      await NotificationToken.deleteOne({
        _id: installationRecord._id,
      });

      record = tokenRecord;
    } else {
      record =
        tokenRecord ||
        installationRecord ||
        new NotificationToken();
    }

    record.userId = userId;
    record.installationId =
      cleanInstallationId;
    record.token = cleanToken;
    record.platform = cleanPlatform;
    record.deviceName =
      String(deviceName || "").trim();
    record.isActive = true;
    record.lastSeenAt = new Date();
    record.lastFailedAt = null;
    record.failureReason = "";

    try {
      await record.save();
    } catch (error) {
      /*
       * A second simultaneous request may have
       * completed first. Read the canonical row
       * and update it instead of returning 500.
       */
      if (error?.code !== 11000) {
        throw error;
      }

      const canonicalRecord =
        await NotificationToken.findOne({
          $or: [
            {
              token: cleanToken,
            },
            {
              installationId:
                cleanInstallationId,
            },
          ],
        });

      if (!canonicalRecord) {
        throw error;
      }

      await NotificationToken.deleteMany({
        _id: {
          $ne: canonicalRecord._id,
        },

        $or: [
          {
            token: cleanToken,
          },
          {
            installationId:
              cleanInstallationId,
          },
        ],
      });

      canonicalRecord.userId = userId;
      canonicalRecord.installationId =
        cleanInstallationId;
      canonicalRecord.token = cleanToken;
      canonicalRecord.platform =
        cleanPlatform;
      canonicalRecord.deviceName =
        String(deviceName || "").trim();
      canonicalRecord.isActive = true;
      canonicalRecord.lastSeenAt =
        new Date();
      canonicalRecord.lastFailedAt = null;
      canonicalRecord.failureReason = "";

      await canonicalRecord.save();

      record = canonicalRecord;
    }

    return res.status(200).json({
      success: true,
      message:
        "Notification device registered",
      device: record,
    });
  } catch (error) {
    console.error(
      "registerDeviceToken error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Unable to register notification device",
    });
  }
}

export async function deactivateDeviceToken(
  req,
  res,
) {
  try {
    const {
      userId,
      installationId,
    } = req.body;

    if (!userId || !installationId) {
      return res.status(400).json({
        success: false,
        message:
          "userId and installationId are required",
      });
    }

    await NotificationToken.updateOne(
      {
        userId,
        installationId,
      },
      {
        $set: {
          isActive: false,
          lastSeenAt: new Date(),
        },
      },
    );

    /*
     * Return success even if it was already
     * inactive. Logout should be idempotent.
     */
    return res.status(200).json({
      success: true,
      message:
        "This installation was deactivated",
    });
  } catch (error) {
    console.error(
      "deactivateDeviceToken error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getMyNotifications(
  req,
  res,
) {
  try {
    const { userId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        userId,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const notifications =
      await Notification.find({
        userId,
      })
        .sort({
          createdAt: -1,
        })
        .limit(100)
        .lean();

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error(
      "getMyNotifications error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function markNotificationRead(
  req,
  res,
) {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid notification id",
      });
    }

    const updated =
      await Notification
        .findByIdAndUpdate(
          id,
          {
            $set: {
              read: true,
            },
          },
          {
            new: true,
          },
        );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    console.error(
      "markNotificationRead error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function sendToUser(
  req,
  res,
) {
  let inboxNotification = null;

  try {
    const {
      userId,
      title,
      body,
      type = "system",
      data = {},
    } = req.body;

    const cleanTitle = String(
      title || "",
    ).trim();

    const cleanBody = String(
      body || "",
    ).trim();

    if (
      !userId ||
      !cleanTitle ||
      !cleanBody
    ) {
      return res.status(400).json({
        success: false,
        message:
          "userId, title and body are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        userId,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const rawDevices =
      await NotificationToken.find({
        userId,
        isActive: true,
      }).lean();

    const devices =
      dedupeDeviceRecords(rawDevices);

    /*
     * Store the Alerts record before Firebase
     * sends the push.
     *
     * When the mobile push listener runs, the
     * Alerts record already exists.
     */
    inboxNotification =
      await Notification.create({
        userId,
        title: cleanTitle,
        body: cleanBody,
        type,
        data,
        deliveryStatus:
          devices.length > 0
            ? "queued"
            : "failed",
        read: false,
        failureReason:
          devices.length > 0
            ? ""
            : "No active device registrations",
      });

    if (devices.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No active device registrations found",
        notification:
          inboxNotification,
      });
    }

    const pushResult =
      await sendPushToDeviceRecords({
        deviceRecords: devices,
        title: cleanTitle,
        body: cleanBody,

        data: {
          ...data,
          type,
          screen:
            data.screen ||
            "notifications",
        },
      });

    const deliveryMap =
      buildUserDeliveryMap(
        pushResult.results,
      );

    await updateInboxDeliveryStatuses(
      [inboxNotification],
      deliveryMap,
    );

    return res.status(200).json({
      success: true,
      message:
        "Notification processed",
      totalDevices:
        pushResult.uniqueDevices.length,
      successCount:
        pushResult.successCount,
      failureCount:
        pushResult.failureCount,
      invalidTokensDisabled:
        pushResult
          .invalidTokensDisabled,
    });
  } catch (error) {
    console.error(
      "sendToUser error:",
      error,
    );

    if (inboxNotification?._id) {
      await Notification.updateOne(
        {
          _id: inboxNotification._id,
        },
        {
          $set: {
            deliveryStatus: "failed",
            sentAt: new Date(),
            failureReason:
              error.message,
          },
        },
      ).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function sendToTopic(
  req,
  res,
) {
  try {
    const {
      topic,
      title,
      body,
      type = "system",
      data = {},
    } = req.body;

    const cleanTopic = String(
      topic || "",
    ).trim();

    const cleanTitle = String(
      title || "",
    ).trim();

    const cleanBody = String(
      body || "",
    ).trim();

    if (
      !cleanTopic ||
      !cleanTitle ||
      !cleanBody
    ) {
      return res.status(400).json({
        success: false,
        message:
          "topic, title and body are required",
      });
    }

    const messageId =
      await admin.messaging().send({
        topic: cleanTopic,

        notification: {
          title: cleanTitle,
          body: cleanBody,
        },

        data:
          stringifyNotificationData({
            ...data,
            type,
            screen:
              data.screen ||
              "notifications",
          }),

        android: {
          priority: "high",

          notification: {
            channelId: "default",
            sound: "default",
          },
        },

        apns: {
          payload: {
            aps: {
              sound: "default",
            },
          },
        },
      });

    /*
     * A topic push is push-only here because this
     * backend currently does not store a database
     * list of topic members.
     */
    return res.status(200).json({
      success: true,
      messageId,
    });
  } catch (error) {
    console.error(
      "sendToTopic error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getUnreadCount(
  req,
  res,
) {
  try {
    const { userId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        userId,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const count =
      await Notification.countDocuments({
        userId,
        read: false,
      });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error(
      "getUnreadCount error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function sendToAllUsers(
  req,
  res,
) {
  let inboxDocuments = [];

  try {
    const {
      title,
      body,
      type = "system",
      data = {},
    } = req.body;

    const cleanTitle = String(
      title || "",
    ).trim();

    const cleanBody = String(
      body || "",
    ).trim();

    if (!cleanTitle || !cleanBody) {
      return res.status(400).json({
        success: false,
        message:
          "title and body are required",
      });
    }

    const rawDevices =
      await NotificationToken.find({
        isActive: true,
      }).lean();

    const devices =
      dedupeDeviceRecords(rawDevices);

    if (devices.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No active notification devices found",
      });
    }

    const uniqueUserIds =
      uniqueUserIdsFromDevices(
        devices,
      );

    /*
     * One Alerts record per user.
     *
     * Store these records before sending FCM so
     * the mobile received-listener can immediately
     * retrieve them.
     */
    inboxDocuments =
      await Notification.insertMany(
        uniqueUserIds.map(
          (userId) => ({
            userId,
            title: cleanTitle,
            body: cleanBody,
            type,
            data,
            deliveryStatus: "queued",
            read: false,
          }),
        ),
      );

    /*
     * One FCM push per unique device token.
     */
    const pushResult =
      await sendPushToDeviceRecords({
        deviceRecords: devices,
        title: cleanTitle,
        body: cleanBody,

        data: {
          ...data,
          type,
          screen:
            data.screen ||
            "notifications",
        },
      });

    const deliveryMap =
      buildUserDeliveryMap(
        pushResult.results,
      );

    await updateInboxDeliveryStatuses(
      inboxDocuments,
      deliveryMap,
    );

    return res.status(200).json({
      success: true,
      message:
        "Notification sent to all users",

      totalUsers:
        uniqueUserIds.length,

      totalDevices:
        pushResult.uniqueDevices.length,

      successCount:
        pushResult.successCount,

      failureCount:
        pushResult.failureCount,

      invalidTokensDisabled:
        pushResult
          .invalidTokensDisabled,
    });
  } catch (error) {
    console.error(
      "sendToAllUsers error:",
      error,
    );

    if (inboxDocuments.length > 0) {
      await Notification.updateMany(
        {
          _id: {
            $in: inboxDocuments.map(
              (document) =>
                document._id,
            ),
          },
        },
        {
          $set: {
            deliveryStatus: "failed",
            sentAt: new Date(),
            failureReason:
              error.message,
          },
        },
      ).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}