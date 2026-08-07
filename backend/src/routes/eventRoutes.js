import express from "express";

import {
  createEvent,
  getCalendarEvents,
  getEventById,
  getEvents,
} from "../controllers/eventController.js";

import {
  requireInternalAdmin,
} from "../middleware/requireInternalAdmin.js";

const router =
  express.Router();

router.get(
  "/",
  getEvents,
);

router.post(
  "/",
  requireInternalAdmin,
  createEvent,
);

router.get(
  "/calendar/all",
  getCalendarEvents,
);

/*
 * Keep the dynamic route last.
 */
router.get(
  "/:id",
  getEventById,
);

export default router;
