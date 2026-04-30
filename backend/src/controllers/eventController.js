import mongoose from "mongoose";
import Event from "../models/Event.js";

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });

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

    const event = await Event.findById(id);

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

    if (
      typeof event.seats === "number" &&
      event.seats > 0 &&
      event.registeredUsers.length >= event.seats
    ) {
      return res.status(400).json({
        success: false,
        message: "No seats available",
      });
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