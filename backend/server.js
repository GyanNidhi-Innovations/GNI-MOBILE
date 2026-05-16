// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";

import registerRoutes from "./src/routes/registerRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import { initFirebaseAdmin } from "./src/config/firebaseAdmin.js";
import premisesRoutes from "./src/routes/premisesRoutes.js";

dotenv.config();

const app = express();

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
mongoose.set("bufferCommands", false);

// Health checks
app.get("/", (_req, res) => {
  res.status(200).send("🚀 Mobile backend running");
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    uptime: process.uptime(),
  });
});

// Routes
app.use("/api", registerRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/premises", premisesRoutes);

const PORT = process.env.PORT || 8080;

mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose connected");
  console.log("readyState:", mongoose.connection.readyState);
  console.log("db name:", mongoose.connection.name);
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ Mongoose disconnected");
});

async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URL;

    if (!mongoUri) {
      throw new Error("MONGODB_URL is missing in environment variables");
    }

    // Firebase init can fail if credentials are missing; make it visible in logs
    try {
      initFirebaseAdmin();
      console.log("✅ Firebase Admin initialized");
    } catch (firebaseErr) {
      console.error("❌ Firebase Admin init failed:", firebaseErr.message);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup error:", err.message);
    process.exit(1);
  }
}

startServer();