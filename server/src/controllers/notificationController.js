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
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

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
      sentAt: new Date(),
    });

    // deactivate invalid tokens
    for (let index = 0; index < response.responses.length; index++) {
  const r = response.responses[index];

  if (!r.success) {
    const code = r.error?.code || "";

    if (
      code.includes("registration-token-not-registered") ||
      code.includes("invalid-argument")
    ) {
      await NotificationToken.findOneAndUpdate(
        { token: tokenValues[index] },
        { isActive: false }
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
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
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