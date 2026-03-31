import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --------------------
// MongoDB Connection
// --------------------
mongoose
  .connect(`${process.env.MONGODB_URL}/auth`)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

// --------------------
// Registration Model (same as your website)
// --------------------
const RegistrationSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: String,
    college: String,
    year: String,
    branch: String,
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const Registration = mongoose.model("Registration", RegistrationSchema);

// --------------------
// LOGIN API
// --------------------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await Registration.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        college: user.college,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// --------------------
// TEST ROUTE
// --------------------
app.get("/", (req, res) => {
  res.send("🚀 Mobile backend running");
});

// --------------------
// START SERVER
// --------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});