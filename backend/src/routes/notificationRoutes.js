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

import {
  requireAuth,
} from "../middleware/requireAuth.js";


const router = express.Router();

router.post("/register-token", requireAuth,registerDeviceToken);
router.post(
  "/deactivate-token",requireAuth,
  deactivateDeviceToken,
);
router.get("/user/:userId", requireAuth,getMyNotifications);
router.patch("/:id/read", requireAuth,markNotificationRead);
router.post("/send", sendToUser);
router.post("/send-topic", sendToTopic);
router.get("/unread/:userId", requireAuth, getUnreadCount);
router.post("/send-all", sendToAllUsers);

export default router;