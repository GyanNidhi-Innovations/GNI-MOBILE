import express from "express";

import {
  deactivateDeviceToken,
  getMyNotifications,
  getNotificationAnalyticsOverview,
  getNotificationAnalyticsTrend,
  getNotificationCampaign,
  getNotificationCampaignRecipients,
  getNotificationCampaigns,
  getUnreadCount,
  markNotificationOpenedByCampaign,
  markNotificationRead,
  registerDeviceToken,
  sendToAllUsers,
  sendToTopic,
  sendToUser,
} from "../controllers/notificationController.js";

import {
  requireAuth,
} from "../middleware/requireAuth.js";

import {
  requireInternalAdmin,
} from "../middleware/requireInternalAdmin.js";

const router =
  express.Router();

/*
 * Mobile-user routes.
 */
router.post(
  "/register-token",
  requireAuth,
  registerDeviceToken,
);

router.post(
  "/deactivate-token",
  requireAuth,
  deactivateDeviceToken,
);

router.get(
  "/user/:userId",
  requireAuth,
  getMyNotifications,
);

router.get(
  "/unread/:userId",
  requireAuth,
  getUnreadCount,
);

router.patch(
  "/:id/read",
  requireAuth,
  markNotificationRead,
);

router.patch(
  "/campaigns/:campaignId/opened",
  requireAuth,
  markNotificationOpenedByCampaign,
);

/*
 * Service-to-service administrator routes.
 *
 * The Demos admin backend authenticates the
 * administrator cookie and forwards these
 * requests with x-admin-api-key.
 */
router.post(
  "/send",
  requireInternalAdmin,
  sendToUser,
);

router.post(
  "/send-all",
  requireInternalAdmin,
  sendToAllUsers,
);

router.post(
  "/send-topic",
  requireInternalAdmin,
  sendToTopic,
);

router.get(
  "/admin/analytics/overview",
  requireInternalAdmin,
  getNotificationAnalyticsOverview,
  getNotificationAnalyticsTrend,
);

router.get(
  "/admin/analytics/trends",
  requireInternalAdmin,
  getNotificationAnalyticsTrend,
);

router.get(
  "/admin/campaigns",
  requireInternalAdmin,
  getNotificationCampaigns,
);

router.get(
  "/admin/campaigns/:campaignId",
  requireInternalAdmin,
  getNotificationCampaign,
);

router.get(
  "/admin/campaigns/:campaignId/recipients",
  requireInternalAdmin,
  getNotificationCampaignRecipients,
);

export default router;
