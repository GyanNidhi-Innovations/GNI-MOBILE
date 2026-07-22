import mongoose from "mongoose";
import Event from "../models/Event.js";
import NotificationToken from "../models/NotificationToken.js";
import Notification from "../models/Notification.js";
import { admin } from "../config/firebaseAdmin.js";

import {
  buildUserDeliveryMap,
  dedupeDeviceRecords,
  sendPushToDeviceRecords,
  uniqueUserIdsFromDevices,
} from "../services/pushNotificationService.js";

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
                    event.image,
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

            imageUrl:
              event.image,

            data: {
              type: "event",
              screen: "events",
              eventId:
                String(event._id),
               
              imageUrl:
                event.image,
            },
          });

         console.log(
  "[PUSH-DEBUG][EVENT] Firebase result",
  {
    eventId:
      String(event._id),

    imageUrl:
      event.image,

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
