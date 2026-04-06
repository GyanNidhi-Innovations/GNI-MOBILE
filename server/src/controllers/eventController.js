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