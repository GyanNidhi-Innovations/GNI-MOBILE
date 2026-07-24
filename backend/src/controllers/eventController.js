import mongoose from "mongoose";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import NotificationToken from "../models/NotificationToken.js";
import Notification from "../models/Notification.js";
import { admin } from "../config/firebaseAdmin.js";

import {
  buildUserDeliveryMap,
  dedupeDeviceRecords,
  sendPushToDeviceRecords,
  uniqueUserIdsFromDevices,
} from "../services/pushNotificationService.js";


function normalizeNotificationImageUrl(
  value,
) {
  const imageUrl =
    String(value || "").trim();

  if (!imageUrl) {import mongoose from "mongoose";

import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import NotificationToken from "../models/NotificationToken.js";
import Notification from "../models/Notification.js";

import {
  buildUserDeliveryMap,
  dedupeDeviceRecords,
  sendPushToDeviceRecords,
  uniqueUserIdsFromDevices,
} from "../services/pushNotificationService.js";

function normalizeHttpUrl(value) {
  const input = String(value || "").trim();
  if (!input) return "";

  try {
    const url = new URL(input);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseBoolean(value) {
  return [true, "true", 1, "1"].includes(value);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSpeakers(value) {
  let speakers = value;

  if (
    typeof speakers === "string"
  ) {
    try {
      speakers =
        JSON.parse(speakers);
    } catch {
      speakers = [];
    }
  }

  if (!Array.isArray(speakers)) {
    return [];
  }

  return speakers
    .slice(0, 20)
    .map((speaker) => {
      const name =
        String(
          speaker?.name || "",
        ).trim();

      if (!name) {
        return null;
      }

      return {
        name,

        description:
          String(
            speaker?.description ||
              "",
          )
            .trim()
            .slice(0, 2000),

        image:
          normalizeNotificationImageUrl(
            speaker?.image,
          ),
      };
    })
    .filter(Boolean);
}

function normalizeSessions(value) {
  let sessions = value;

  if (
    typeof sessions === "string"
  ) {
    try {
      sessions =
        JSON.parse(sessions);
    } catch {
      sessions = [];
    }
  }

  if (!Array.isArray(sessions)) {
    return [];
  }

  return sessions
    .slice(0, 31)
    .map((session) => {
      const label =
        String(
          session?.label || "",
        ).trim();

      const startAt =
        new Date(
          session?.startAt,
        );

      const zoomRegistrationUrl =
        normalizeNotificationImageUrl(
          session
            ?.zoomRegistrationUrl,
        );

      if (
        !label ||
        Number.isNaN(
          startAt.getTime(),
        ) ||
        !zoomRegistrationUrl
      ) {
        return null;
      }

      return {
        label,
        startAt,
        zoomRegistrationUrl,
      };
    })
    .filter(Boolean);
}

async function sendEventPush(event) {
  const rawDevices = await NotificationToken.find({
    isActive: true,
  }).lean();

  const devices = dedupeDeviceRecords(rawDevices);
  const uniqueUserIds = uniqueUserIdsFromDevices(devices);
  const imageUrl = normalizeHttpUrl(event.image);

  const baseResult = {
    totalUsers: uniqueUserIds.length,
    totalDevices: devices.length,
    successCount: 0,
    failureCount: 0,
    invalidTokensDisabled: 0,
  };

  console.log("[PUSH-DEBUG][EVENT] device state", {
    database: mongoose.connection.name,
    collection: NotificationToken.collection.name,
    eventId: String(event._id),
    activeDeviceRecords: rawDevices.length,
    deduplicatedActiveDevices: devices.length,
    tokenLast10: devices.map((device) =>
      String(device.token || "").slice(-10),
    ),
  });

  if (devices.length === 0) return baseResult;

  const title = "New Event";
  const body = `${event.title} is now available. Register now.`;

  const inboxDocuments = await Notification.insertMany(
    uniqueUserIds.map((userId) => ({
      userId,
      title,
      body,
      type: "event",
      data: {
        screen: "events",
        eventId: String(event._id),
        imageUrl,
      },
      deliveryStatus: "queued",
      read: false,
    })),
  );

  try {
    const pushResult = await sendPushToDeviceRecords({
      deviceRecords: devices,
      title,
      body,
      imageUrl: imageUrl || undefined,
      data: {
        type: "event",
        screen: "events",
        eventId: String(event._id),
        imageUrl,
      },
    });

    console.log("[PUSH-DEBUG][EVENT] Firebase result", {
      eventId: String(event._id),
      imageUrl,
      successCount: pushResult.successCount,
      failureCount: pushResult.failureCount,
      invalidTokensDisabled: pushResult.invalidTokensDisabled,
      deviceResults: pushResult.results.map((result) => ({
        userId: result.userId,
        installationId: result.installationId,
        tokenLast10: String(result.token || "").slice(-10),
        success: result.success,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      })),
    });

    const deliveryMap = buildUserDeliveryMap(pushResult.results);

    const operations = inboxDocuments.map((document) => {
      const delivery = deliveryMap.get(String(document.userId));
      const delivered = (delivery?.successCount || 0) > 0;

      return {
        updateOne: {
          filter: { _id: document._id },
          update: {
            $set: {
              deliveryStatus: delivered ? "sent" : "failed",
              sentAt: new Date(),
              failureReason: delivered
                ? ""
                : (delivery?.errors || []).join(", ") ||
                  "Push delivery failed",
            },
          },
        },
      };
    });

    if (operations.length > 0) {
      await Notification.bulkWrite(operations);
    }

    return {
      totalUsers: uniqueUserIds.length,
      totalDevices: pushResult.uniqueDevices.length,
      successCount: pushResult.successCount,
      failureCount: pushResult.failureCount,
      invalidTokensDisabled: pushResult.invalidTokensDisabled,
    };
  } catch (error) {
    console.error("Event push delivery error:", error);

    await Notification.updateMany(
      {
        _id: {
          $in: inboxDocuments.map((document) => document._id),
        },
      },
      {
        $set: {
          deliveryStatus: "failed",
          sentAt: new Date(),
          failureReason: error.message,
        },
      },
    );

    return {
      ...baseResult,
      failureCount: devices.length,
      error: error.message,
    };
  }
}

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      eventType,
      date,
      startAt,
      endAt,
      location,
      organizer,
      image,
      registrationUrl,
      speakers,
      sessions,
      status,
      sendNotification,
    } = req.body;

    const startDate = parseDate(startAt || date);
    const endDate = parseDate(endAt);

    if (
      !title ||
      !description ||
      !startDate ||
      !endDate ||
      !organizer ||
      !image ||
      !registrationUrl
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, description, start time, end time, organizer, poster and Google Form URL are required",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Event end time must be after the start time",
      });
    }

    const cleanImage = normalizeHttpUrl(image);
    const cleanRegistrationUrl = normalizeHttpUrl(registrationUrl);

    if (!cleanImage) {
      return res.status(400).json({
        success: false,
        message: "Event poster must be a valid HTTP or HTTPS URL",
      });
    }

    if (!cleanRegistrationUrl) {
      return res.status(400).json({
        success: false,
        message: "Google Form URL must be a valid HTTP or HTTPS URL",
      });
    }

    const cleanFormat = ["online", "in_person", "hybrid"].includes(format)
      ? format
      : "online";

    if (cleanFormat !== "online" && !String(location || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Location is required for in-person and hybrid events",
      });
    }

    const cleanStatus = [
      "draft",
      "published",
      "closed",
      "cancelled",
      "completed",
    ].includes(status)
      ? status
      : "published";

    const event = await Event.create({
      title: String(title).trim(),
      description: String(description).trim(),
      eventType: String(eventType || "Event").trim().slice(0, 80),

      // Legacy compatibility.
      date: startDate,

      startAt: startDate,
      endAt: endDate,
      timezone: String(timezone || "Asia/Kolkata").trim(),
      location: String(
        location || (cleanFormat === "online" ? "Online" : ""),
      ).trim(),
      organizer: String(organizer).trim(),
      image: cleanImage,
      registrationUrl: cleanRegistrationUrl,
      speakers: normalizeSpeakers(speakers),
      sessions:normalizeSessions(sessions),
                   
      status: cleanStatus,
    });

    console.log("[PUSH-DEBUG][EVENT] event created", {
      eventId: String(event._id),
      title: event.title,
      startAt: event.startAt,
      sendNotification: parseBoolean(sendNotification),
      imageUrl: event.image,
    });

    let notification = {
      skipped: true,
      reason: "Notification was not requested",
    };

    if (
      parseBoolean(sendNotification) &&
      event.status === "published"
    ) {
      notification = await sendEventPush(event);
    }

    return res.status(201).json({
      success: true,
      message: notification?.error
        ? "Event created, but push delivery had errors"
        : parseBoolean(sendNotification)
          ? "Event created and notification processed"
          : "Event created successfully",
      event,
      notification,
    });
  } catch (error) {
    console.error("createEvent error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating event",
      error: error.message,
    });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate(
        "registeredUsers",
        "name fullName email phone mobile studentEmail",
      )
      .sort({ startAt: 1, date: 1 });

    return res.json({ success: true, events });
  } catch (error) {
    console.error("getEvents error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching events",
      error: error.message,
    });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event id",
      });
    }

    const event = await Event.findById(id).populate(
      "registeredUsers",
      "name fullName email phone mobile studentEmail",
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.json({ success: true, event });
  } catch (error) {
    console.error("getEventById error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching event details",
      error: error.message,
    });
  }
};

/*
 * Retained for compatibility with any old direct-registration code.
 * New mobile event pages use the Google Form webhook instead.
 */
export const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid event and user ids are required",
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const alreadyRegistered = event.registeredUsers.some(
      (registeredUserId) =>
        String(registeredUserId) === String(userId),
    );

    if (!alreadyRegistered) {
      event.registeredUsers.push(userId);
      await event.save();
    }

    return res.json({
      success: true,
      alreadyRegistered,
      message: alreadyRegistered
        ? "Already registered for this event"
        : "Registered successfully",
      event,
    });
  } catch (error) {
    console.error("registerForEvent error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while registering for event",
      error: error.message,
    });
  }
};

export const googleFormRegistration = async (req, res) => {
  try {
    const expectedSecret = String(
      process.env.GOOGLE_FORM_WEBHOOK_SECRET || "",
    );

    const receivedSecret = String(
      req.get("x-gni-form-secret") || "",
    );

    if (!expectedSecret) {
      return res.status(500).json({
        success: false,
        message: "GOOGLE_FORM_WEBHOOK_SECRET is not configured",
      });
    }

    if (receivedSecret !== expectedSecret) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook secret",
      });
    }

    const {
      eventId,
      email,
      fullName,
      phone,
      googleResponseId,
      submittedAt,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid eventId is required",
      });
    }

    const emailNormalized = normalizeEmail(email);

    if (!emailNormalized) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const user = await Registration.findOne({
      email: {
        $regex: `^${escapeRegex(emailNormalized)}$`,
        $options: "i",
      },
    }).select("_id name email phone");

    const existing = event.registrations.find(
      (registration) =>
        registration.emailNormalized === emailNormalized,
    );

    if (!existing) {
      event.registrations.push({
        email: emailNormalized,
        emailNormalized,
        fullName: String(fullName || user?.name || "").trim(),
        phone: String(phone || user?.phone || "").trim(),
        googleResponseId: String(googleResponseId || "").trim(),
        userId: user?._id || null,
        source: "google_form",
        submittedAt: parseDate(submittedAt) || new Date(),
      });
    } else {
      existing.fullName = String(
        fullName || existing.fullName || user?.name || "",
      ).trim();

      existing.phone = String(
        phone || existing.phone || user?.phone || "",
      ).trim();

      if (googleResponseId) {
        existing.googleResponseId = String(googleResponseId).trim();
      }

      if (user?._id && !existing.userId) {
        existing.userId = user._id;
      }
    }

    if (user?._id) {
      const linked = event.registeredUsers.some(
        (registeredUserId) =>
          String(registeredUserId) === String(user._id),
      );

      if (!linked) {
        event.registeredUsers.push(user._id);
      }
    }

    await event.save();

    console.log(
      "[EVENT-REGISTRATION] Google Form response recorded",
      {
        eventId: String(event._id),
        email: emailNormalized,
        userMatched: Boolean(user?._id),
        registrationCount: event.registrations.length,
      },
    );

    return res.json({
      success: true,
      registered: true,
      userMatched: Boolean(user?._id),
      message: user?._id
        ? "Registration recorded and linked to the GyanNidhi user"
        : "Registration recorded, but no GyanNidhi account matched the submitted email",
    });
  } catch (error) {
    console.error("googleFormRegistration error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while recording Google Form registration",
      error: error.message,
    });
  }
};

export const getEventRegistrationStatus = async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid event and user ids are required",
      });
    }

    const [event, user] = await Promise.all([
      Event.findById(id).lean(),
      Registration.findById(userId)
        .select("_id email name")
        .lean(),
    ]);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const emailNormalized = normalizeEmail(user.email);

    const linkedUser = (event.registeredUsers || []).some(
      (registeredUserId) =>
        String(registeredUserId) === String(user._id),
    );

    const registration = (event.registrations || []).find(
      (entry) =>
        entry.emailNormalized === emailNormalized ||
        String(entry.userId || "") === String(user._id),
    );

    return res.json({
      success: true,
      registered: Boolean(linkedUser || registration),
      registration: registration || null,
    });
  } catch (error) {
    console.error("getEventRegistrationStatus error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while checking registration status",
      error: error.message,
    });
  }
};

export const getCalendarEvents = async (req, res) => {
  try {
    const events = await Event.find({
      status: { $nin: ["draft", "cancelled"] },
    })
      .sort({ startAt: 1, date: 1 })
      .lean();

    return res.json({
      success: true,
      events: events.map((event) => ({
        _id: event._id,
        title: event.title,
        date: event.startAt || event.date || null,
        startAt: event.startAt || event.date || null,
        endAt: event.endAt || null,
        location: event.location || "",
        description:
          event.shortDescription || event.description || "",
        format: event.format || "online",
      })),
    });
  } catch (error) {
    console.error("getCalendarEvents error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching calendar events",
      error: error.message,
    });
  }
};

export const getMyRegisteredEvents = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const events = await Event.find({
      registeredUsers: userId,
    }).sort({ startAt: 1, date: 1 });

    return res.json({ success: true, events });
  } catch (error) {
    console.error("getMyRegisteredEvents error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching registered events",
      error: error.message,
    });
  }
};

export const getMyEvents = getMyRegisteredEvents;

    return "";
  }

  try {
    const parsedUrl =
      new URL(imageUrl);

    if (
      parsedUrl.protocol !== "https:" &&
      parsedUrl.protocol !== "http:"
    ) {
      return "";
    }

    /*
     * URL.toString() converts spaces in the
     * pathname to %20.
     */
    return parsedUrl.toString();
  } catch {
    return "";
  }
}

export const createEvent = async (
  req,
  res,
) => {
  try {
    const {
      title,
      description,
      date,
      location,
      organizer,
      image,
      seats: rawSeats,
    } = req.body;

    if (
      !title ||
      !description ||
      !date ||
      !location ||
      !organizer ||
      !image
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required",
      });
    }

    let seats = null;

    if (
      rawSeats !== "" &&
      rawSeats !== null &&
      rawSeats !== undefined
    ) {
      seats = Number(rawSeats);

      if (
        Number.isNaN(seats) ||
        seats < 0
      ) {
        seats = 0;
      }
    }

    const event = await Event.create({
      title: String(title).trim(),
      description:
        String(description).trim(),
      date,
      location:
        String(location).trim(),
      organizer:
        String(organizer).trim(),
      image,
      seats,
    });

    const notificationImageUrl =
  normalizeNotificationImageUrl(
    event.image,
  );

console.log(
  "[PUSH-DEBUG][EVENT] normalized image URL",
  {
    originalImageUrl:
      event.image,

    notificationImageUrl,

    validForFirebase:
      Boolean(notificationImageUrl),
  },
);

    console.log(
  "[PUSH-DEBUG][EVENT] event created",
  {
    eventId: String(event._id),
    title: event.title,
    imageUrl: event.image,
    imageUrlLength:
      String(event.image || "").length,
    imageUsesHttps:
      /^https:\/\//i.test(
        String(event.image || ""),
      ),
  },
);

    const rawDevices =
      await NotificationToken.find({
        isActive: true,
      }).lean();

    const devices =
      dedupeDeviceRecords(rawDevices);

    const uniqueUserIds =
      uniqueUserIdsFromDevices(
        devices,
      );

      const totalDeviceRecords =
  await NotificationToken.countDocuments(
    {},
  );

const inactiveDeviceRecords =
  await NotificationToken.countDocuments({
    isActive: false,
  });

console.log(
  "[PUSH-DEBUG][EVENT] device state",
  {
    database:
      mongoose.connection.name,

    collection:
      NotificationToken.collection.name,

    eventId:
      String(event._id),

    totalDeviceRecords,

    rawActiveDeviceRecords:
      rawDevices.length,

    deduplicatedActiveDevices:
      devices.length,

    inactiveDeviceRecords,

    activeDevices:
      devices.map((device) => ({
        userId:
          String(device.userId || ""),

        installationId:
          device.installationId,

        tokenLast10:
          String(
            device.token || "",
          ).slice(-10),
      })),
  },
);

    let inboxDocuments = [];

    let notificationResult = {
      totalUsers:
        uniqueUserIds.length,

      totalDevices:
        devices.length,

      successCount: 0,
      failureCount: 0,
      invalidTokensDisabled: 0,
    };

    if (devices.length === 0) {
  console.warn(
    "[PUSH-DEBUG][EVENT] push skipped because no active devices exist",
    {
      eventId:
        String(event._id),

      totalDeviceRecords,

      inactiveDeviceRecords,
    },
  );
}

    if (devices.length > 0) {
      const notificationTitle =
        "New Event";

      const notificationBody =
        `${event.title} is now available. Register now.`;

      /*
       * Create one Alerts record per user before
       * sending the Firebase push.
       */
      inboxDocuments =
        await Notification.insertMany(
          uniqueUserIds.map(
            (userId) => ({
              userId,

              title:
                notificationTitle,

              body:
                notificationBody,

              type: "event",

              data: {
                screen: "events",
                            
                eventId:
                  String(event._id),
                            
                imageUrl:
                  notificationImageUrl,
              },

              deliveryStatus:
                "queued",

              read: false,
            }),
          ),
        );

      try {
        const pushResult =
  await sendPushToDeviceRecords({
    deviceRecords: devices,

    title:
      notificationTitle,

    body:
      notificationBody,

    /*
     * Send a rich notification image only when
     * the normalized URL is valid.
     */
    imageUrl:
      notificationImageUrl ||
      undefined,

    data: {
      type: "event",
      screen: "events",

      eventId:
        String(event._id),

      imageUrl:
        notificationImageUrl,
    },
  });

 console.log(
  "[PUSH-DEBUG][EVENT] Firebase result",
  {
    eventId:
      String(event._id),

    originalImageUrl:
      event.image,

    notificationImageUrl,

    totalUniqueDevices:
      pushResult.uniqueDevices.length,

    successCount:
      pushResult.successCount,

    failureCount:
      pushResult.failureCount,

    invalidTokensDisabled:
      pushResult
        .invalidTokensDisabled,

    deviceResults:
      pushResult.results.map(
        (result) => ({
          userId:
            result.userId,

          installationId:
            result.installationId,

          tokenLast10:
            String(
              result.token || "",
            ).slice(-10),

          success:
            result.success,

          errorCode:
            result.errorCode,

          errorMessage:
            result.errorMessage,
        }),
      ),
  },
);


        notificationResult = {
          totalUsers:
            uniqueUserIds.length,

          totalDevices:
            pushResult
              .uniqueDevices.length,

          successCount:
            pushResult.successCount,

          failureCount:
            pushResult.failureCount,

          invalidTokensDisabled:
            pushResult
              .invalidTokensDisabled,
        };

        const deliveryMap =
          buildUserDeliveryMap(
            pushResult.results,
          );

        const operations =
          inboxDocuments.map(
            (document) => {
              const userDelivery =
                deliveryMap.get(
                  String(
                    document.userId,
                  ),
                );

              const delivered =
                (
                  userDelivery
                    ?.successCount || 0
                ) > 0;

              return {
                updateOne: {
                  filter: {
                    _id:
                      document._id,
                  },

                  update: {
                    $set: {
                      deliveryStatus:
                        delivered
                          ? "sent"
                          : "failed",

                      sentAt:
                        new Date(),

                      failureReason:
                        delivered
                          ? ""
                          : (
                              userDelivery
                                ?.errors ||
                              []
                            ).join(
                              ", ",
                            ) ||
                            "Push delivery failed",
                    },
                  },
                },
              };
            },
          );

        await Notification.bulkWrite(
          operations,
        );
      } catch (pushError) {
        console.error(
          "Event push delivery error:",
          pushError,
        );

        await Notification.updateMany(
          {
            _id: {
              $in:
                inboxDocuments.map(
                  (document) =>
                    document._id,
                ),
            },
          },
          {
            $set: {
              deliveryStatus:
                "failed",

              sentAt: new Date(),

              failureReason:
                pushError.message,
            },
          },
        );

        notificationResult = {
          ...notificationResult,
          failureCount:
            devices.length,
          error:
            pushError.message,
        };
      }
    }

    return res.status(201).json({
      success: true,

      message:
        notificationResult.error
          ? "Event created, but push delivery had errors"
          : "Event created and notification processed",

      event,

      notification:
        notificationResult,
    });
  } catch (error) {
    console.error(
      "createEvent error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating event",
      error: error.message,
    });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
  .populate(
    "registeredUsers",
    "fullName name email phone mobile studentEmail"
  )
  .sort({ date: 1 });

    return res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("getEvents error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching events",
      error: error.message,
    });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("getEventById req.params.id:", id);

    if (!id || id === "undefined") {
      return res.status(400).json({
        success: false,
        message: "Event id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event id",
      });
    }

    const event = await Event.findById(id).populate(
      "registeredUsers",
      "fullName name email phone mobile studentEmail"
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("getEventById error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching event details",
      error: error.message,
    });
  }
};

export const registerForEvent = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;

    if (!id || id === "undefined") {
      return res.status(400).json({
        success: false,
        message: "Event id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event id",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const alreadyRegistered = event.registeredUsers.some(
      (registeredUserId) => registeredUserId.toString() === userId.toString()
    );

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: "Already registered for this event",
      });
    }

// ---------------- SEAT VALIDATION ----------------
if (
  event.seats !== null &&
  event.seats !== undefined
) {
  if (event.seats <= 0) {
    return res.status(400).json({
      success: false,
      message: "No seats available",
    });
  }

  if (event.registeredUsers.length >= event.seats) {
    return res.status(400).json({
      success: false,
      message: "No seats available",
    });
  }
}

    event.registeredUsers.push(userId);
    await event.save();

    return res.status(200).json({
      success: true,
      message: "Registered successfully",
      event,
    });
  } catch (error) {
    console.error("registerForEvent error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while registering for event",
      error: error.message,
    });
  }
};

export const getMyEvents = async (req, res) => {
  try {
    const { userId } = req.params;

    const events = await Event.find({
      registeredUsers: userId,
    });

    return res.json({
      success: true,
      events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCalendarEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });

    const calendarItems = events.map((event) => ({
      _id: event._id,
      title: event.title,
      date: event.date || null,
      location: event.location || "",
      description: event.description || "",
    }));

    return res.status(200).json({
      success: true,
      events: calendarItems,
    });
  } catch (error) {
    console.error("getCalendarEvents error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching calendar events",
      error: error.message,
    });
  }
};

export const getMyRegisteredEvents = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId === "undefined") {
      return res.status(400).json({
        success: false,
        message: "User id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const events = await Event.find({
      registeredUsers: userId,
    }).sort({ date: 1 });

    return res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("getMyRegisteredEvents error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching registered events",
      error: error.message,
    });
  }
};
