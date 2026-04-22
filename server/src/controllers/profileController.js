import mongoose from "mongoose";
import Registration from "../models/Registration.js";

export const getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "undefined") {
      return res.status(400).json({
        success: false,
        message: "User id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const user = await Registration.findById(id).select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("getProfile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
      error: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "undefined") {
      return res.status(400).json({
        success: false,
        message: "User id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const allowedFields = [
      "name",
      "phone",
      "college",
      "year",
      "branch",
      "skills",
      "degree",
      "passoutYear",
      "joiningyear",
      "specialization",
      "locationPreferences",
      "currentCompany",
      "currentRole",
      "experience",
      "careerGoals",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await Registration.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("updateProfile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating profile",
      error: error.message,
    });
  }
};