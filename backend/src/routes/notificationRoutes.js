import express from "express";
import {
  registerDeviceToken,
  deactivateDeviceToken,
  getMyNotifications,
  markNotificationRead,
  sendToUser,
  sendToTopic,
  getUnreadCount,
  sendToAllUsers,
} from "../controllers/notificationController.js";

const router = express.Router();

router.post("/register-token", registerDeviceToken);
router.post(
  "/deactivate-token",
  deactivateDeviceToken,
);
router.get("/user/:userId", getMyNotifications);
router.patch("/:id/read", markNotificationRead);
router.post("/send", sendToUser);
router.post("/send-topic", sendToTopic);
router.get("/unread/:userId", getUnreadCount);
router.post("/send-all", sendToAllUsers);

export default router;