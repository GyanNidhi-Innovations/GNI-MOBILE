// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import registerRoutes from "./src/routes/registerRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Optional but useful for exposing the real issue quickly
mongoose.set("bufferCommands", false);

app.use("/api", registerRoutes);
app.use("/api/events", eventRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Mobile backend running");
});

const PORT = process.env.PORT || 5000;

mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose connected");
  console.log("readyState:", mongoose.connection.readyState); // should be 1
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
    console.log("Connecting to MongoDB:", mongoUri);

    await mongoose.connect(mongoUri);

    console.log("✅ MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  }
}

startServer();