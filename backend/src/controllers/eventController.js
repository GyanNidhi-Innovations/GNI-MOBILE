import mongoose from "mongoose";

import Event from "../models/Event.js";
import NotificationToken from "../models/NotificationToken.js";
import Notification from "../models/Notification.js";

import {
  buildUserDeliveryMap,
  dedupeDeviceRecords,
  sendPushToDeviceRecords,
  uniqueUserIdsFromDevices,
} from "../services/pushNotificationService.js";

function normalizeHttpUrl(value) {
  const input =
    String(value || "").trim();

  if (!input) {
    return "";
  }

  try {
    const url =
      new URL(input);

    if (
      ![
        "http:",
        "https:",
      ].includes(
        url.protocol,
      )
    ) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date;
}

function parseBoolean(value) {
  return [
    true,
    "true",
    1,
    "1",
  ].includes(value);
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

  if (
    !Array.isArray(speakers)
  ) {
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
          normalizeHttpUrl(
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

  if (
    !Array.isArray(sessions)
  ) {
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
        parseDate(
          session?.startAt,
        );

      const zoomRegistrationUrl =
        normalizeHttpUrl(
          session
            ?.zoomRegistrationUrl,
        );

      if (
        !label ||
        !startAt ||
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

function normalizeContentSections(
  value,
) {
  let sections = value;

  if (
    typeof sections === "string"
  ) {
    try {
      sections =
        JSON.parse(sections);
    } catch {
      sections = [];
    }
  }

  if (!Array.isArray(sections)) {
    return [];
  }

  return sections
    .slice(0, 30)
    .map((section) => {
      const title =
        String(
          section?.title || "",
        ).trim();

      const description =
        String(
          section?.description ||
            "",
        ).trim();

      if (
        !title ||
        !description
      ) {
        return null;
      }

      return {
        title:
          title.slice(0, 200),

        description:
          description.slice(
            0,
            5000,
          ),
      };
    })
    .filter(Boolean);
}


async function sendEventPush(
  event,
) {
  const rawDevices =
    await NotificationToken.find({
      isActive: true,
    }).lean();

  const devices =
    dedupeDeviceRecords(
      rawDevices,
    );

  const uniqueUserIds =
    uniqueUserIdsFromDevices(
      devices,
    );

  const imageUrl =
    normalizeHttpUrl(
      event.image,
    );

  const baseResult = {
    totalUsers:
      uniqueUserIds.length,

    totalDevices:
      devices.length,

    successCount: 0,

    failureCount: 0,

    invalidTokensDisabled: 0,
  };

  console.log(
    "[PUSH-DEBUG][EVENT] device state",
    {
      database:
        mongoose.connection.name,

      collection:
        NotificationToken
          .collection.name,

      eventId:
        String(event._id),

      activeDeviceRecords:
        rawDevices.length,

      deduplicatedActiveDevices:
        devices.length,

      tokenLast10:
        devices.map(
          (device) =>
            String(
              device.token || "",
            ).slice(-10),
        ),
    },
  );

  if (
    devices.length === 0
  ) {
    return baseResult;
  }

  const title =
    "New Event";

  const body =
    `${event.title} is now available. Register now.`;

  const inboxDocuments =
    uniqueUserIds.length > 0
      ? await Notification.insertMany(
          uniqueUserIds.map(
            (userId) => ({
              userId,

              title,

              body,

              type: "event",

              data: {
                screen:
                  "events",

                eventId:
                  String(
                    event._id,
                  ),

                imageUrl,
              },

              deliveryStatus:
                "queued",

              read: false,
            }),
          ),
        )
      : [];

  try {
    const pushResult =
      await sendPushToDeviceRecords({
        deviceRecords:
          devices,

        title,

        body,

        imageUrl:
          imageUrl ||
          undefined,

        data: {
          type: "event",

          screen: "events",

          eventId:
            String(event._id),

          imageUrl,
        },
      });

    const deliveryMap =
      buildUserDeliveryMap(
        pushResult.results,
      );

    const operations =
      inboxDocuments.map(
        (document) => {
          const delivery =
            deliveryMap.get(
              String(
                document.userId,
              ),
            );

          const delivered =
            (
              delivery?.successCount ||
              0
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
                          delivery?.errors ||
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

    if (
      operations.length > 0
    ) {
      await Notification.bulkWrite(
        operations,
      );
    }

    console.log(
      "[PUSH-DEBUG][EVENT] Firebase result",
      {
        eventId:
          String(event._id),

        imageUrl,

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
                  result.token ||
                    "",
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

    return {
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
  } catch (error) {
    console.error(
      "Event push delivery error:",
      error,
    );

    if (
      inboxDocuments.length > 0
    ) {
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

            sentAt:
              new Date(),

            failureReason:
              error.message,
          },
        },
      );
    }

    return {
      ...baseResult,

      failureCount:
        devices.length,

      error:
        error.message,
    };
  }
}

export const createEvent =
  async (req, res) => {
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
        contentSections,
        status,
        sendNotification,
      } = req.body;

      const startDate =
        parseDate(
          startAt || date,
        );

      const endDate =
        parseDate(endAt);

      if (
        !title ||
        !description ||
        !startDate ||
        !endDate ||
        !location ||
        !organizer ||
        !image ||
        !registrationUrl
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Title, description, start time, end time, location, organizer, poster and Google Form URL are required",
          });
      }

      if (
        endDate <= startDate
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Event end time must be after the start time",
          });
      }

      const cleanImage =
        normalizeHttpUrl(
          image,
        );

      const cleanRegistrationUrl =
        normalizeHttpUrl(
          registrationUrl,
        );

      if (!cleanImage) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Event poster must be a valid HTTP or HTTPS URL",
          });
      }

      if (
        !cleanRegistrationUrl
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Google Form URL must be a valid HTTP or HTTPS URL",
          });
      }

      const cleanStatus =
        [
          "draft",
          "published",
          "closed",
          "cancelled",
          "completed",
        ].includes(status)
          ? status
          : "published";

      const event =
        await Event.create({
          title:
            String(
              title,
            ).trim(),

          description:
            String(
              description,
            ).trim(),

          eventType:
            String(
              eventType ||
                "Event",
            )
              .trim()
              .slice(0, 80),

          date:
            startDate,

          startAt:
            startDate,

          endAt:
            endDate,

          timezone:
            "Asia/Kolkata",

          location:
            String(
              location,
            ).trim(),

          organizer:
            String(
              organizer,
            ).trim(),

          image:
            cleanImage,

          registrationUrl:
            cleanRegistrationUrl,

          contentSections:
  normalizeContentSections(
    contentSections,
  ),

          speakers:
            normalizeSpeakers(
              speakers,
            ),

          sessions:
            normalizeSessions(
              sessions,
            ),

          status:
            cleanStatus,
        });

      console.log(
        "[PUSH-DEBUG][EVENT] event created",
        {
          eventId:
            String(event._id),

          title:
            event.title,

          startAt:
            event.startAt,

          sendNotification:
            parseBoolean(
              sendNotification,
            ),

          imageUrl:
            event.image,
        },
      );

      let notification = {
        skipped: true,

        reason:
          "Notification was not requested",
      };

      if (
        parseBoolean(
          sendNotification,
        ) &&
        event.status ===
          "published"
      ) {
        notification =
          await sendEventPush(
            event,
          );
      }

      return res
        .status(201)
        .json({
          success: true,

          message:
            notification?.error
              ? "Event created, but push delivery had errors"
              : parseBoolean(
                    sendNotification,
                  )
                ? "Event created and notification processed"
                : "Event created successfully",

          event,

          notification,
        });
    } catch (error) {
      console.error(
        "createEvent error:",
        error,
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Server error while creating event",

          error:
            error.message,
        });
    }
  };

export const getEvents =
  async (req, res) => {
    try {
      const events =
  await Event.find()
    .sort({
      createdAt: -1,
    });

      return res.json({
        success: true,
        events,
      });
    } catch (error) {
      console.error(
        "getEvents error:",
        error,
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Server error while fetching events",

          error:
            error.message,
        });
    }
  };

export const getEventById =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types
          .ObjectId.isValid(id)
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid event id",
          });
      }

      const event =
        await Event.findById(
          id,
        ).populate(
          "registeredUsers",

          "name fullName email phone mobile studentEmail",
        );

      if (!event) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Event not found",
          });
      }

      return res.json({
        success: true,
        event,
      });
    } catch (error) {
      console.error(
        "getEventById error:",
        error,
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Server error while fetching event details",

          error:
            error.message,
        });
    }
  };



export const getCalendarEvents =
  async (req, res) => {
    try {
      const events =
        await Event.find({
          status: {
            $nin: [
              "draft",
              "cancelled",
            ],
          },
        })
          .sort({
            startAt: 1,
            date: 1,
          })
          .lean();

      return res.json({
        success: true,

        events:
          events.map(
            (event) => ({
              _id:
                event._id,

              title:
                event.title,

              date:
                event.startAt ||
                event.date ||
                null,

              startAt:
                event.startAt ||
                event.date ||
                null,

              endAt:
                event.endAt ||
                null,

              location:
                event.location ||
                "",

              description:
                event.description ||
                "",
            }),
          ),
      });
    } catch (error) {
      console.error(
        "getCalendarEvents error:",
        error,
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Server error while fetching calendar events",

          error:
            error.message,
        });
    }
  };

export const getMyRegisteredEvents =
  async (req, res) => {
    try {
      const { userId } =
        req.params;

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
              "Invalid user id",
          });
      }

      const events =
        await Event.find({
          registeredUsers:
            userId,
        }).sort({
          startAt: 1,
          date: 1,
        });

      return res.json({
        success: true,
        events,
      });
    } catch (error) {
      console.error(
        "getMyRegisteredEvents error:",
        error,
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Server error while fetching registered events",

          error:
            error.message,
        });
    }
  };

