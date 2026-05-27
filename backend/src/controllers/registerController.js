// src/controllers/registerController.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { uploadResumeToSpaces } from "../services/spacesService.js";
import Registration from "../models/Registration.js";

export const loginRegistrationUser = async (req, res) => {
  try {
    console.log("LOGIN req.body:", req.body);

    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

  
    console.log("mongoose readyState:", mongoose.connection.readyState);
    console.log("mongoose connection name:", mongoose.connection.name);
    console.log("mongoose model names:", mongoose.modelNames());
    console.log("Registration db:", Registration.db?.name);
    console.log("Registration collection:", Registration.collection?.name);

    const normalizedEmail = email.toLowerCase().trim();
    console.log("normalizedEmail:", normalizedEmail);

    const user = await Registration.findOne({ email: normalizedEmail });
    console.log("user found:", !!user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.password) {
      return res.status(500).json({
        success: false,
        message: "User account has no password stored. Please reset or re-register.",
      });
    }

    console.log("user fields:", {
      id: user._id,
      email: user.email,
      type: user.type,
      hasPassword: !!user.password,
      passwordType: typeof user.password,
    });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        type: user.type,
      },
      process.env.JWT_SECRET || "your_super_secret_key",
      {
        expiresIn: "30d",
      }
);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        type: user.type,
        name: user.name,
        email: user.email,
        phone: user.phone,
        college: user.college,
        year: user.year,
        branch: user.branch,
        degree: user.degree,
        passoutYear: user.passoutYear,
        joiningyear: user.joiningyear,
        specialization: user.specialization,
        currentCompany: user.currentCompany,
        currentRole: user.currentRole,
        experience: user.experience,
        skills: user.skills,
        resume: user.resume || null,
        resumeSpacesKey: user.resumeSpacesKey || null,
        resumeOriginalName: user.resumeOriginalName || null,
        resumeStoredName: user.resumeStoredName || null,
      },
    });
  } catch (error) {
    console.error("loginRegistrationUser error:", error);
    console.error("loginRegistrationUser stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

export const registerUser = async (req, res) => {
  try {
    console.log("REGISTER req.body:", req.body);
    console.log(
      "REGISTER req.file:",
      req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : null
    );

    console.log("mongoose readyState:", mongoose.connection.readyState);
    console.log("mongoose connection name:", mongoose.connection.name);
    console.log("Registration db:", Registration.db?.name);
    console.log("Registration collection:", Registration.collection?.name);

    const {
      type,
      name,
      email,
      phone,
      password,
      college,
      year,
      joiningyear,
      passoutYear,
      branch,
      specialization,
      skills,
      degree,
      currentCompany,
      currentRole,
      experience,
      locationPreferences,
      careerGoals,
    } = req.body || {};

    if (!type || !name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Type, name, email, phone and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await Registration.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let resumeFields = {};

    if (req.file) {
      const uploaded = await uploadResumeToSpaces(
        req.file.buffer,
        req.file.originalname,
        normalizedEmail.replace(/[^a-zA-Z0-9]/g, "_")
      );

      resumeFields = {
        resume: uploaded.spacesUrl,
        resumeSpacesKey: uploaded.spacesKey,
        resumeOriginalName: uploaded.originalName,
        resumeStoredName: uploaded.storedName,
        resumeUpdatedAt: new Date(),
      };
    }

    const user = await Registration.create({
      type: String(type).trim(),
      name: name.trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      password: hashedPassword,
      college: college?.trim() || "",
      year: year?.trim() || "",
      joiningyear: joiningyear ? Number(joiningyear) : undefined,
      passoutYear: passoutYear ? Number(passoutYear) : undefined,
      branch: branch?.trim() || "",
      specialization: specialization?.trim() || "",
      skills: skills?.trim() || "",
      degree: degree?.trim() || "",
      currentCompany: currentCompany?.trim() || "",
      currentRole: currentRole?.trim() || "",
      experience: experience?.trim() || "",
      locationPreferences: locationPreferences?.trim() || "",
      careerGoals: careerGoals?.trim() || "",
      ...resumeFields,
    });

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      user: {
        id: user._id,
        type: user.type,
        name: user.name,
        email: user.email,
        resume: user.resume || null,
        resumeSpacesKey: user.resumeSpacesKey || null,
        resumeOriginalName: user.resumeOriginalName || null,
        resumeStoredName: user.resumeStoredName || null,
      },
    });
  } catch (error) {
    console.error("registerUser error:", error);
    console.error("registerUser stack:", error.stack);

    if (error.message?.includes("Only PDF, DOC, and DOCX")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during signup",
      error: error.message,
    });
  }
};

