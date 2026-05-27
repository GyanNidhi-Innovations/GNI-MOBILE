import NotificationToken from "../models/NotificationToken.js";
import Notification from "../models/Notification.js";
import { admin } from "../config/firebaseAdmin.js";

export async function registerDeviceToken(req, res) {
  try {
    const { userId, token, platform, deviceName } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: "userId and token are required",
      });
    }

    const saved = await NotificationToken.findOneAndUpdate(
      { token },
      {
        userId,
        token,
        platform: platform || "unknown",
        deviceName: deviceName || "",
        isActive: true,
        lastSeenAt: new Date(),
      },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      token: saved,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getMyNotifications(req, res) {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;

    const updated = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    return res.json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function sendToUser(req, res) {
  try {
    const { userId, title, body, type, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: "userId, title, and body are required",
      });
    }

    const tokens = await NotificationToken.find({
      userId,
      isActive: true,
    });

    if (!tokens.length) {
      const notif = await Notification.create({
        userId,
        title,
        body,
        type: type || "system",
        data: data || {},
        deliveryStatus: "failed",
        failureReason: "No active device tokens",
      });

      return res.status(404).json({
        success: false,
        message: "No active device tokens found",
        notification: notif,
      });
    }

    const tokenValues = tokens.map((t) => t.token);

    const message = {
      tokens: tokenValues,
      notification: {
        title,
        body,
      },
      data: Object.fromEntries(
        Object.entries(data || {}).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: "high",
        notification: {
          channelId: "default",
          sound: "default",
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    const failures = response.responses.map((r, index) => ({
      tokenLast10: tokenValues[index]?.slice(-10),
      success: r.success,
      errorCode: r.error?.code || null,
      errorMessage: r.error?.message || null,
    }));

    const failedOnly = failures.filter((f) => !f.success);

    await Notification.create({
      userId,
      title,
      body,
      type: type || "system",
      data: data || {},
      deliveryStatus:
        response.failureCount === 0
          ? "sent"
          : response.successCount > 0
          ? "partial"
          : "failed",
      failureReason:
        failedOnly.length > 0
          ? failedOnly.map((f) => f.errorCode).join(", ")
          : "",
      sentAt: new Date(),
    });

    for (let index = 0; index < response.responses.length; index++) {
      const r = response.responses[index];

      if (!r.success) {
        const code = r.error?.code || "";

        if (
          code.includes("registration-token-not-registered") ||
          code.includes("invalid-registration-token") ||
          code.includes("invalid-argument")
        ) {
          await NotificationToken.findOneAndUpdate(
            { token: tokenValues[index] },
            {
              isActive: false,
              failureReason: code,
              lastFailedAt: new Date(),
            }
          );
        }
      }
    }

    return res.json({
      success: true,
      message: "Notification processed",
      result: {
        successCount: response.successCount,
        failureCount: response.failureCount,
        failures: failedOnly,
      },
    });
  } catch (error) {
    console.error("sendToUser error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
      code: error.code || null,
    });
  }
}

export async function sendToTopic(req, res) {
  try {
    const { topic, title, body, data } = req.body;

    const response = await admin.messaging().send({
      topic,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data || {}).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: "high",
      },
    });

    return res.json({
      success: true,
      messageId: response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getUnreadCount(req, res) {
  try {
    const { userId } = req.params;

    const count = await Notification.countDocuments({
      userId,
      read: false,
    });

    return res.json({
      success: true,
      count,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function sendToAllUsers(req, res) {
  try {
    const { title, body, type = "system", data = {} } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: "title and body are required",
      });
    }

    const tokens = await NotificationToken.find({ isActive: true }).lean();

    if (!tokens.length) {
      return res.status(404).json({
        success: false,
        message: "No active notification tokens found",
      });
    }

    const messages = tokens.map((item) => ({
      token: item.token,
      notification: {
        title,
        body,
      },
      data: Object.fromEntries(
        Object.entries({
          ...data,
          type,
          screen: data.screen || "notifications",
        }).map(([key, value]) => [key, String(value)])
      ),
      android: {
        priority: "high",
        notification: {
          channelId: "default",
          sound: "default",
        },
      },
    }));

    const batches = [];
    for (let i = 0; i < messages.length; i += 500) {
      batches.push(messages.slice(i, i + 500));
    }

    let successCount = 0;
    let failureCount = 0;
    const failedTokens = [];

    for (const batch of batches) {
      const response = await admin.messaging().sendEach(batch);

      response.responses.forEach((result, index) => {
        if (result.success) {
          successCount += 1;
        } else {
          failureCount += 1;
          failedTokens.push({
            token: batch[index].token,
            error: result.error?.code || result.error?.message,
          });
        }
      });
    }

    await Notification.insertMany(
      tokens.map((item) => ({
        userId: item.userId,
        title,
        body,
        type,
        data,
        deliveryStatus: "sent",
        read: false,
        sentAt: new Date(),
      }))
    );

    return res.json({
      success: true,
      message: "Notification sent to all users",
      totalTokens: tokens.length,
      successCount,
      failureCount,
      failedTokens,
    });
  } catch (error) {
    console.error("sendToAllUsers error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}