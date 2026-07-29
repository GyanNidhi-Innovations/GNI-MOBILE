// routes/registerRoutes.js
import express from "express";
import upload from "../middleware/upload.js";
import {
  loginRegistrationUser,
  registerUser,
  forgotRegistrationPassword,
  requestRegistrationPasswordOtp,
  verifyRegistrationPasswordOtp,
  validateRegistrationResetToken,
  resetRegistrationPassword,
   refreshRegistrationSession,
  logoutRegistrationSession,
} from "../controllers/registerController.js";

const router = express.Router();

router.post("/login", loginRegistrationUser);
router.post(
  "/refresh-token",
  refreshRegistrationSession,
);

router.post(
  "/logout",
  logoutRegistrationSession,
);
router.post("/forgot-password", forgotRegistrationPassword);
router.get("/reset-password/validate/:token", validateRegistrationResetToken);
router.post("/reset-password/:token", resetRegistrationPassword);
router.post("/signup", upload.single("resume"), registerUser);

router.post(
  "/mobile/forgot-password/request-otp",
  requestRegistrationPasswordOtp,
);

router.post(
  "/mobile/forgot-password/verify-otp",
  verifyRegistrationPasswordOtp,
);

export default router;