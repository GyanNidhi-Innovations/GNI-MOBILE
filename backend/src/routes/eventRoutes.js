import express from "express";

import {
  createEvent,
  getCalendarEvents,
  getEventById,
  getEvents,
} from "../controllers/eventController.js";

const router = express.Router();

router.get(
  "/",
  getEvents,
);

router.post(
  "/",
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