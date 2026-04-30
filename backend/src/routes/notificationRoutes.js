import express from "express";
import {
  registerDeviceToken,
  getMyNotifications,
  markNotificationRead,
  sendToUser,
  sendToTopic,
  getUnreadCount,
} from "../controllers/notificationController.js";

const router = express.Router();

router.post("/register-token", registerDeviceToken);
router.get("/user/:userId", getMyNotifications);
router.patch("/:id/read", markNotificationRead);
router.post("/send", sendToUser);
router.post("/send-topic", sendToTopic);
router.get("/unread/:userId", getUnreadCount);

export default router;