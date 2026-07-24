import express from "express";

import {
  createEvent,
  getCalendarEvents,
  getEventById,
  getEventRegistrationStatus,
  getEvents,
  getMyRegisteredEvents,
  googleFormRegistration,
  registerForEvent,
} from "../controllers/eventController.js";

const router =
  express.Router();

router.get(
  "/",
  getEvents,
);

router.post(
  "/",
  createEvent,
);

router.post(
  "/google-form-registration",
  googleFormRegistration,
);

router.get(
  "/calendar/all",
  getCalendarEvents,
);

router.get(
  "/registered/:userId",
  getMyRegisteredEvents,
);

router.get(
  "/:id/registration-status/:userId",
  getEventRegistrationStatus,
);

router.post(
  "/:id/register",
  registerForEvent,
);

/*
 * Keep the dynamic /:id route last.
 */
router.get(
  "/:id",
  getEventById,
);

export default router;