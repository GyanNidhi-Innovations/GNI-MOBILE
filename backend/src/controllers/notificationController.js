import mongoose from "mongoose";

import NotificationToken from "../models/NotificationToken.js";
import Notification from "../models/Notification.js";
import NotificationCampaign from "../models/NotificationCampaign.js";
import { admin } from "../config/firebaseAdmin.js";

import {
  dedupeDeviceRecords,
  sendPushToDeviceRecords,
  stringifyNotificationData,
  uniqueUserIdsFromDevices,
} from "../services/pushNotificationService.js";

import {
  campaignActorFromRequest,
  createNotificationCampaign,
  failCampaignPush,
  finalizeCampaignWithPushResult,
  getAnalyticsOverview,
  getCampaignDetails,
  listCampaignRecipients,
  listCampaigns,
} from "../services/notificationAnalyticsService.js";

function isAuthenticatedUser(
  req,
  requestedUserId,
) {
  return (
    String(
      req.auth?.userId ||
        "",
    ) ===
    String(
      requestedUserId ||
        "",
    )
  );
}

function rejectOtherUserAccess(
  res,
) {
  return res.status(403).json({
    success: false,
    message:
      "You cannot access another user's notification data",
  });
}

const ALLOWED_TYPES =
  new Set([
    "event",
    "course",
    "reminder",
    "system",
    "feedback",
    "exam",
    "drive",
    "offer",
  ]);

const ALLOWED_SCREENS =
  new Set([
    "notifications",
    "events",
    "calendar",
    "courses",
    "profile",
  ]);

function cleanNotificationInput(
  body = {},
) {
  const title =
    String(
      body.title || "",
    )
      .trim()
      .slice(0, 200);

  const message =
    String(
      body.body || "",
    )
      .trim()
      .slice(0, 2000);

  const type =
    ALLOWED_TYPES.has(
      body.type,
    )
      ? body.type
      : "system";

  const suppliedData =
    body.data &&
    typeof body.data ===
      "object" &&
    !Array.isArray(
      body.data,
    )
      ? body.data
      : {};

  const screen =
    ALLOWED_SCREENS.has(
      suppliedData.screen,
    )
      ? suppliedData.screen
      : "notifications";

  return {
    title,
    body: message,
    type,
    screen,
    data: {
      ...suppliedData,
      screen,
    },
  };
}

function sendResponseStatus(
  summary,
) {
  return summary.successCount > 0
    ? 200
    : 502;
}

export async function registerDeviceToken(
  req,
  res,
) {
  try {
    const {
      userId,
      installationId,
      token,
      platform,
      deviceName,
    } = req.body;

    if (
      !isAuthenticatedUser(
        req,
        userId,
      )
    ) {
      return rejectOtherUserAccess(
        res,
      );
    }

    console.log(
      "[PUSH-DEBUG][BACKEND] register-token received",
      {
        database:
          mongoose.connection.name,

        collection:
          NotificationToken
            .collection.name,

        userId,
        installationId,
        platform,
        deviceName,

        tokenLength:
          String(
            token || "",
          ).length,

        tokenLast10:
          String(
            token || "",
          ).slice(-10),
      },
    );

    const cleanInstallationId =
      String(
        installationId || "",
      ).trim();

    const cleanToken =
      String(
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
      return res
        .status(400)
        .json({
          success: false,
          message:
            "userId, installationId and token are required",
        });
    }

    if (
      !mongoose.Types.ObjectId
        .isValid(userId)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid userId",
        });
    }

    const [
      tokenRecord,
      installationRecord,
    ] = await Promise.all([
      NotificationToken.findOne({
        token:
          cleanToken,
      }),

      NotificationToken.findOne({
        installationId:
          cleanInstallationId,
      }),
    ]);

    console.log(
      "[PUSH-DEBUG][BACKEND] registration lookup result",
      {
        tokenRecordFound:
          Boolean(tokenRecord),

        tokenRecordId:
          tokenRecord?._id
            ? String(
                tokenRecord._id,
              )
            : null,

        tokenRecordUserId:
          tokenRecord?.userId
            ? String(
                tokenRecord.userId,
              )
            : null,

        tokenRecordIsActive:
          tokenRecord?.isActive ??
          null,

        tokenRecordInstallationId:
          tokenRecord
            ?.installationId ||
          null,

        installationRecordFound:
          Boolean(
            installationRecord,
          ),

        installationRecordId:
          installationRecord?._id
            ? String(
                installationRecord._id,
              )
            : null,

        installationRecordUserId:
          installationRecord
            ?.userId
            ? String(
                installationRecord
                  .userId,
              )
            : null,

        installationRecordIsActive:
          installationRecord
            ?.isActive ??
          null,

        installationRecordTokenLast10:
          String(
            installationRecord
              ?.token || "",
          ).slice(-10),
      },
    );

    let record;

    if (
      tokenRecord &&
      installationRecord &&
      String(tokenRecord._id) !==
        String(
          installationRecord._id,
        )
    ) {
      await NotificationToken.deleteOne({
        _id:
          installationRecord._id,
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

    record.token =
      cleanToken;

    record.platform =
      cleanPlatform;

    record.deviceName =
      String(
        deviceName || "",
      ).trim();

    record.isActive = true;
    record.lastSeenAt =
      new Date();

    record.lastFailedAt =
      null;

    record.failureReason =
      "";

    try {
      await record.save();
    } catch (error) {
      if (
        error?.code !== 11000
      ) {
        throw error;
      }

      const canonicalRecord =
        await NotificationToken
          .findOne({
            $or: [
              {
                token:
                  cleanToken,
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

      await NotificationToken
        .deleteMany({
          _id: {
            $ne:
              canonicalRecord._id,
          },

          $or: [
            {
              token:
                cleanToken,
            },
            {
              installationId:
                cleanInstallationId,
            },
          ],
        });

      canonicalRecord.userId =
        userId;

      canonicalRecord
        .installationId =
        cleanInstallationId;

      canonicalRecord.token =
        cleanToken;

      canonicalRecord.platform =
        cleanPlatform;

      canonicalRecord.deviceName =
        String(
          deviceName || "",
        ).trim();

      canonicalRecord.isActive =
        true;

      canonicalRecord.lastSeenAt =
        new Date();

      canonicalRecord.lastFailedAt =
        null;

      canonicalRecord.failureReason =
        "";

      await canonicalRecord.save();

      record =
        canonicalRecord;
    }

    console.log(
      "[PUSH-DEBUG][BACKEND] device registration saved",
      {
        database:
          mongoose.connection.name,

        collection:
          NotificationToken
            .collection.name,

        documentId:
          String(record._id),

        userId:
          String(record.userId),

        installationId:
          record
            .installationId,

        platform:
          record.platform,

        isActive:
          record.isActive,

        tokenLength:
          String(
            record.token || "",
          ).length,

        tokenLast10:
          String(
            record.token || "",
          ).slice(-10),

        lastSeenAt:
          record.lastSeenAt,

        lastFailedAt:
          record.lastFailedAt,

        failureReason:
          record.failureReason,
      },
    );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Notification device registered",
        device:
          record,
      });
  } catch (error) {
    console.error(
      "registerDeviceToken error:",
      error,
    );

    return res
      .status(500)
      .json({
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

    if (
      !isAuthenticatedUser(
        req,
        userId,
      )
    ) {
      return rejectOtherUserAccess(
        res,
      );
    }

    if (
      !userId ||
      !installationId
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "userId and installationId are required",
        });
    }

    if (
      !mongoose.Types.ObjectId
        .isValid(userId)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid userId",
        });
    }

    console.log(
      "[PUSH-DEBUG][BACKEND] deactivate-token received",
      {
        database:
          mongoose.connection.name,

        collection:
          NotificationToken
            .collection.name,

        userId,
        installationId,
      },
    );

    const deactivateResult =
      await NotificationToken
        .updateOne(
          {
            userId,
            installationId:
              String(
                installationId,
              ).trim(),
          },
          {
            $set: {
              isActive:
                false,

              lastSeenAt:
                new Date(),
            },
          },
        );

    console.log(
      "[PUSH-DEBUG][BACKEND] deactivate-token completed",
      {
        userId,
        installationId,

        matchedCount:
          deactivateResult
            .matchedCount,

        modifiedCount:
          deactivateResult
            .modifiedCount,
      },
    );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "This installation was deactivated",
      });
  } catch (error) {
    console.error(
      "deactivateDeviceToken error:",
      error,
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message,
      });
  }
}

export async function getMyNotifications(
  req,
  res,
) {
  try {
    const {
      userId,
    } = req.params;

    if (
      !isAuthenticatedUser(
        req,
        userId,
      )
    ) {
      return rejectOtherUserAccess(
        res,
      );
    }

    if (
      !mongoose.Types.ObjectId
        .isValid(userId)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid userId",
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

    return res
      .status(200)
      .json({
        success: true,
        notifications,
      });
  } catch (error) {
    console.error(
      "getMyNotifications error:",
      error,
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message,
      });
  }
}

export async function markNotificationRead(
  req,
  res,
) {
  try {
    const {
      id,
    } = req.params;

    const authenticatedUserId =
      req.auth?.userId;

    if (
      !authenticatedUserId
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Authentication required",
        });
    }

    if (
      !mongoose.Types
        .ObjectId.isValid(id)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid notification id",
        });
    }

    const notification =
      await Notification
        .findOne({
          _id: id,
          userId:
            authenticatedUserId,
        });

    if (!notification) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Notification not found",
        });
    }

    if (!notification.read) {
      notification.read = true;
      notification.readAt =
        new Date();

      await notification.save();
    }

    return res
      .status(200)
      .json({
        success: true,
        notification,
      });
  } catch (error) {
    console.error(
      "markNotificationRead error:",
      error,
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message,
      });
  }
}

export async function markNotificationOpenedByCampaign(
  req,
  res,
) {
  try {
    const {
      campaignId,
    } = req.params;

    const authenticatedUserId =
      req.auth?.userId;

    if (
      !authenticatedUserId
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Authentication required",
        });
    }

    if (
      !mongoose.Types
        .ObjectId.isValid(
          campaignId,
        )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid campaign id",
        });
    }

    const notification =
      await Notification
        .findOne({
          campaignId,
          userId:
            authenticatedUserId,
        });

    /*
     * Topic sends do not create one inbox record
     * per user. Treat that case as a harmless
     * no-op so notification navigation is never
     * blocked.
     */
    if (!notification) {
      const campaign =
        await NotificationCampaign
          .findById(
            campaignId,
          )
          .select(
            "analyticsAvailable targetType",
          )
          .lean();

      if (
        campaign &&
        !campaign
          .analyticsAvailable
      ) {
        return res
          .status(200)
          .json({
            success: true,
            tracked: false,
            reason:
              "Per-user topic analytics are unavailable",
          });
      }

      return res
        .status(404)
        .json({
          success: false,
          message:
            "Notification recipient record not found",
        });
    }

    if (
      !notification.openedAt
    ) {
      notification.openedAt =
        new Date();

      notification.openSource =
        "system_tray";

      await notification.save();
    }

    return res
      .status(200)
      .json({
        success: true,
        tracked: true,
        notification,
      });
  } catch (error) {
    console.error(
      "markNotificationOpenedByCampaign error:",
      error,
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message,
      });
  }
}


export async function sendToUser(
  req,
  res,
) {
  let campaign = null;
  let inboxNotification = null;
  let devices = [];

  try {
    const {
      userId,
    } = req.body;

    const input =
      cleanNotificationInput(
        req.body,
      );

    if (
      !userId ||
      !input.title ||
      !input.body
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "userId, title and body are required",
        });
    }

    if (
      !mongoose.Types
        .ObjectId.isValid(
          userId,
        )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid userId",
        });
    }

    campaign =
      await createNotificationCampaign({
        source:
          "general",

        targetType:
          "user",

        targetValue:
          String(userId),

        title:
          input.title,

        body:
          input.body,

        type:
          input.type,

        screen:
          input.screen,

        createdBy:
          campaignActorFromRequest(
            req,
          ),
      });

    const rawDevices =
      await NotificationToken
        .find({
          userId,
          isActive: true,
        })
        .lean();

    devices =
      dedupeDeviceRecords(
        rawDevices,
      );

    const inboxData = {
      ...input.data,

      campaignId:
        String(
          campaign._id,
        ),
    };

    inboxNotification =
      await Notification.create({
        userId,

        campaignId:
          campaign._id,

        title:
          input.title,

        body:
          input.body,

        type:
          input.type,

        data:
          inboxData,

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

    if (
      devices.length === 0
    ) {
      const summary =
        await failCampaignPush({
          campaign,

          inboxDocuments: [
            inboxNotification,
          ],

          devices: [],

          error:
            new Error(
              "No active device registrations found",
            ),
        });

      return res
        .status(404)
        .json({
          success: false,
          message:
            "No active device registrations found",
          ...summary,
        });
    }

    const pushResult =
      await sendPushToDeviceRecords({
        deviceRecords:
          devices,

        title:
          input.title,

        body:
          input.body,

        data: {
          ...inboxData,

          type:
            input.type,
        },
      });

    const summary =
      await finalizeCampaignWithPushResult({
        campaign,

        inboxDocuments: [
          inboxNotification,
        ],

        pushResult,
      });

    return res
      .status(
        sendResponseStatus(
          summary,
        ),
      )
      .json({
        success:
          summary.successCount >
          0,

        message:
          summary.successCount >
          0
            ? "Notification processed"
            : "Firebase rejected every targeted device",

        ...summary,
      });
  } catch (error) {
    console.error(
      "sendToUser error:",
      error,
    );

    if (campaign?._id) {
      const summary =
        await failCampaignPush({
          campaign,

          inboxDocuments:
            inboxNotification
              ? [
                  inboxNotification,
                ]
              : [],

          devices,

          error,
        }).catch(() => null);

      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message,
          ...(summary || {}),
        });
    }

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message,
      });
  }
}


export async function sendToTopic(
  req,
  res,
) {
  let campaign = null;

  try {
    const cleanTopic =
      String(
        req.body.topic ||
          "",
      ).trim();

    const input =
      cleanNotificationInput(
        req.body,
      );

    if (
      !cleanTopic ||
      !input.title ||
      !input.body
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "topic, title and body are required",
        });
    }

    campaign =
      await createNotificationCampaign({
        source:
          "topic",

        targetType:
          "topic",

        targetValue:
          cleanTopic,

        title:
          input.title,

        body:
          input.body,

        type:
          input.type,

        screen:
          input.screen,

        analyticsAvailable:
          false,

        createdBy:
          campaignActorFromRequest(
            req,
          ),
      });

    const messageId =
      await admin
        .messaging()
        .send({
          topic:
            cleanTopic,

          notification: {
            title:
              input.title,

            body:
              input.body,
          },

          data:
            stringifyNotificationData({
              ...input.data,

              type:
                input.type,

              campaignId:
                String(
                  campaign._id,
                ),
            }),

          android: {
            priority:
              "high",

            notification: {
              channelId:
                "default",

              sound:
                "default",
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

    campaign.status =
      "completed";
    campaign.topicMessageId =
      messageId;
    campaign.completedAt =
      new Date();

    await campaign.save();

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Topic notification was accepted by FCM",
        campaignId:
          String(
            campaign._id,
          ),
        messageId,
        analyticsAvailable:
          false,
      });
  } catch (error) {
    console.error(
      "sendToTopic error:",
      error,
    );

    if (campaign?._id) {
      campaign.status =
        "failed";
      campaign.failureReason =
        String(
          error.message ||
            error,
        );
      campaign.completedAt =
        new Date();

      await campaign
        .save()
        .catch(() => {});
    }

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message,
        campaignId:
          campaign?._id
            ? String(
                campaign._id,
              )
            : null,
      });
  }
}


export async function getUnreadCount(
  req,
  res,
) {
  try {
    const {
      userId,
    } = req.params;

    if (
      !isAuthenticatedUser(
        req,
        userId,
      )
    ) {
      return rejectOtherUserAccess(
        res,
      );
    }

    if (
      !mongoose.Types.ObjectId
        .isValid(userId)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid userId",
        });
    }

    const count =
      await Notification
        .countDocuments({
          userId,
          read: false,
        });

    return res
      .status(200)
      .json({
        success: true,
        count,
      });
  } catch (error) {
    console.error(
      "getUnreadCount error:",
      error,
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message,
      });
  }
}

export async function sendToAllUsers(
  req,
  res,
) {
  let campaign = null;
  let inboxDocuments = [];
  let devices = [];

  try {
    const input =
      cleanNotificationInput(
        req.body,
      );

    if (
      !input.title ||
      !input.body
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "title and body are required",
        });
    }

    campaign =
      await createNotificationCampaign({
        source:
          "general",

        targetType:
          "all",

        title:
          input.title,

        body:
          input.body,

        type:
          input.type,

        screen:
          input.screen,

        createdBy:
          campaignActorFromRequest(
            req,
          ),
      });

    const rawDevices =
      await NotificationToken
        .find({
          isActive: true,
        })
        .lean();

    devices =
      dedupeDeviceRecords(
        rawDevices,
      );

    if (
      devices.length === 0
    ) {
      const summary =
        await failCampaignPush({
          campaign,

          inboxDocuments: [],

          devices: [],

          error:
            new Error(
              "No active notification devices found",
            ),
        });

      return res
        .status(404)
        .json({
          success: false,
          message:
            "No active notification devices found",
          ...summary,
        });
    }

    const uniqueUserIds =
      uniqueUserIdsFromDevices(
        devices,
      );

    const campaignId =
      String(
        campaign._id,
      );

    const inboxData = {
      ...input.data,
      campaignId,
    };

    inboxDocuments =
      await Notification
        .insertMany(
          uniqueUserIds.map(
            (userId) => ({
              userId,

              campaignId:
                campaign._id,

              title:
                input.title,

              body:
                input.body,

              type:
                input.type,

              data:
                inboxData,

              deliveryStatus:
                "queued",

              read: false,
            }),
          ),
        );

    const pushResult =
      await sendPushToDeviceRecords({
        deviceRecords:
          devices,

        title:
          input.title,

        body:
          input.body,

        data: {
          ...inboxData,

          type:
            input.type,
        },
      });

    const summary =
      await finalizeCampaignWithPushResult({
        campaign,
        inboxDocuments,
        pushResult,
      });

    return res
      .status(
        sendResponseStatus(
          summary,
        ),
      )
      .json({
        success:
          summary.successCount >
          0,

        message:
          summary.successCount >
          0
            ? "Notification processed for all active users"
            : "Firebase rejected every targeted device",

        ...summary,
      });
  } catch (error) {
    console.error(
      "sendToAllUsers error:",
      error,
    );

    if (campaign?._id) {
      const summary =
        await failCampaignPush({
          campaign,
          inboxDocuments,
          devices,
          error,
        }).catch(() => null);

      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message,
          ...(summary || {}),
        });
    }

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message,
      });
  }
}


export async function getNotificationAnalyticsOverview(
  req,
  res,
) {
  try {
    const overview =
      await getAnalyticsOverview(
        req.query,
      );

    return res.status(200).json({
      success: true,
      overview,
    });
  } catch (error) {
    console.error(
      "getNotificationAnalyticsOverview error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
}

export async function getNotificationCampaigns(
  req,
  res,
) {
  try {
    const result =
      await listCampaigns({
        query:
          req.query,
      });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "getNotificationCampaigns error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
}

export async function getNotificationCampaign(
  req,
  res,
) {
  try {
    const campaign =
      await getCampaignDetails(
        req.params
          .campaignId,
      );

    if (!campaign) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Notification campaign not found",
        });
    }

    return res.status(200).json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error(
      "getNotificationCampaign error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
}

export async function getNotificationCampaignRecipients(
  req,
  res,
) {
  try {
    const result =
      await listCampaignRecipients({
        campaignId:
          req.params
            .campaignId,

        query:
          req.query,
      });

    if (!result) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Notification campaign not found",
        });
    }

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "getNotificationCampaignRecipients error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
}
