// src/controllers/registerController.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { uploadResumeToSpaces } from "../services/spacesService.js";
import Registration from "../models/Registration.js";

import crypto from "crypto";
import nodemailer from "nodemailer";



const mailTransporter =
  nodemailer.createTransport({
    host: "mail.smtp2go.com",
    port: 2525,
    secure: false,
    auth: {
      user: process.env.SMTP2GO_USER,
      pass: process.env.SMTP2GO_PASS,
    },
  });

export const loginRegistrationUser = async (req, res) => {
  try {
    console.log("LOGIN email", req.body.email);

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


export const forgotRegistrationPassword =
  async (req, res) => {
    try {
      const email = String(
        req.body?.email || "",
      )
        .trim()
        .toLowerCase();

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const user =
        await Registration.findOne({ email });

      // Always return the same response.
      if (!user) {
        return res.status(200).json({
          success: true,
          message:
            "If an account exists for this email, a reset link has been sent.",
        });
      }

      const rawToken = crypto
        .randomBytes(32)
        .toString("hex");

      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      user.resetPasswordToken =
        hashedToken;

      user.resetPasswordExpires =
        new Date(
          Date.now() + 60 * 60 * 1000,
        );

      await user.save();

      console.log("RESET RAW TOKEN:", rawToken);

console.log(
  "RESET HASH TOKEN:",
  hashedToken
);

      const resetBaseUrl =
        process.env
          .MOBILE_RESET_PASSWORD_URL ||
        "gniapp://auth/reset-password";

      const resetLink =
        `${resetBaseUrl}` +
        `?token=${encodeURIComponent(rawToken)}`;


        console.log("RESET LINK:", resetLink);

      await mailTransporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          '"GyanNidhi" <support@gyannidhi.in>',

        to: user.email,

        subject:
          "Reset your GyanNidhi password",

        text: [
          `Hello ${user.name || "User"},`,
          "",
          "We received a request to reset your password.",
          `Reset your password: ${resetLink}`,
          "",
          "This link expires in one hour.",
          "Ignore this email if you did not request it.",
        ].join("\n"),

        html: `
          <div style="
            max-width:560px;
            margin:0 auto;
            padding:24px;
            font-family:Arial,sans-serif;
            color:#101828;
          ">
            <h2>Reset your password</h2>

            <p>Hello ${user.name || "User"},</p>

            <p>
              We received a request to reset your
              GyanNidhi password.
            </p>

            <p style="margin:28px 0;">
              <a
                href="${resetLink}"
                style="
                  display:inline-block;
                  padding:14px 22px;
                  background:#0F5EFF;
                  color:#FFFFFF;
                  text-decoration:none;
                  border-radius:10px;
                  font-weight:700;
                "
              >
                Reset password
              </a>
            </p>

            <p>This link expires in one hour.</p>

            <p style="
              color:#667085;
              font-size:13px;
            ">
              Ignore this email if you did not
              request a password reset.
            </p>
          </div>
        `,
      });

      return res.status(200).json({
        success: true,
        message:
          "If an account exists for this email, a reset link has been sent.",
      });
    } catch (error) {
      console.error(
        "forgotRegistrationPassword error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to process the password-reset request",
      });
    }
  };

export const validateRegistrationResetToken =
  async (req, res) => {
    try {
      const token = String(
        req.params?.token || "",
      );

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Token is required",
        });
      }

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user =
        await Registration.findOne({
          resetPasswordToken:
            hashedToken,

          resetPasswordExpires: {
            $gt: new Date(),
          },
        }).select(
          "name email type",
        );

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid or expired reset link",
        });
      }

      return res.status(200).json({
        success: true,
        email: user.email,
        name: user.name,
        type: user.type,
      });
    } catch (error) {
      console.error(
        "validateRegistrationResetToken error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to validate the reset link",
      });
    }
  };

export const resetRegistrationPassword =
  async (req, res) => {
    try {
      const token = String(
        req.params?.token || "",
      );

      const password = String(
        req.body?.password || "",
      );

      if (!token || !password) {
        return res.status(400).json({
          success: false,
          message:
            "Token and password are required",
        });
      }

      const validPassword =
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password) &&
        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
          password,
        );

      if (!validPassword) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 8 characters, including uppercase, lowercase, number and special character.",
        });
      }

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user =
        await Registration.findOne({
          resetPasswordToken:
            hashedToken,

          resetPasswordExpires: {
            $gt: new Date(),
          },
        });

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid or expired reset link",
        });
      }

      user.password =
        await bcrypt.hash(password, 10);

      user.resetPasswordToken =
        undefined;

      user.resetPasswordExpires =
        undefined;

      await user.save();

      

      try {
        await mailTransporter.sendMail({
          from:
            process.env.SMTP_FROM ||
            '"GyanNidhi" <support@gyannidhi.in>',

          to: user.email,

          subject:
            "Your password was changed",

          text:
            "Your GyanNidhi password was changed successfully. Contact support immediately if you did not make this change.",
        });
      } catch (mailError) {
        console.error(
          "Password confirmation email error:",
          mailError,
        );
      }

      return res.status(200).json({
        success: true,
        message:
          "Password reset successfully",
      });
    } catch (error) {
      console.error(
        "resetRegistrationPassword error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to reset the password",
      });
    }
  };

export const registerUser = async (req, res) => {
  try {
    console.log("REGISTER email:", req.body.email);
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

