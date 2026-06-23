import mongoose from "mongoose";
import Event from "../models/Event.js";
import NotificationToken from "../models/NotificationToken.js";
import Notification from "../models/Notification.js";
import { admin } from "../config/firebaseAdmin.js";

export const createEvent = async (req, res) => {
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

    // ---------------- VALIDATION ----------------
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
        message: "All fields are required",
      });
    }

    // ---------------- SEATS NORMALIZATION ----------------
    let seats = null; // null = unlimited

    if (
      rawSeats !== "" &&
      rawSeats !== null &&
      rawSeats !== undefined
    ) {
      seats = Number(rawSeats);

      if (isNaN(seats) || seats < 0) {
        seats = 0;
      }
    }

    // ---------------- CREATE EVENT FIRST ----------------
    const event = await Event.create({
      title,
      description,
      date,
      location,
      organizer,
      image,
      seats,
    });

    // ---------------- NOTIFICATIONS ----------------
    const tokens = await NotificationToken.find({ isActive: true }).lean();

    let successCount = 0;
    let failureCount = 0;

    if (tokens.length > 0) {
      const messages = tokens.map((item) => ({
        token: item.token,
        notification: {
          title: "New Event",
          body: `${event.title} is now available. Register now.`,
        },
        data: {
          type: "event",
          screen: "events",
          eventId: String(event._id),
        },
        android: {
          priority: "high",
          notification: {
            channelId: "default",
            sound: "default",
          },
        },
      }));

      for (let i = 0; i < messages.length; i += 500) {
        const batch = messages.slice(i, i + 500);
        const response = await admin.messaging().sendEach(batch);

        successCount += response.successCount || 0;
        failureCount += response.failureCount || 0;
      }

      await Notification.insertMany(
        tokens.map((item) => ({
          userId: item.userId,
          title: "New Event",
          body: `${event.title} is now available. Register now.`,
          type: "event",
          data: {
            screen: "events",
            eventId: String(event._id),
          },
          deliveryStatus: "sent",
          read: false,
          sentAt: new Date(),
        }))
      );
    }

    return res.status(201).json({
      success: true,
      message: "Event created and notification sent",
      event,
      notification: {
        totalTokens: tokens.length,
        successCount,
        failureCount,
      },
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
