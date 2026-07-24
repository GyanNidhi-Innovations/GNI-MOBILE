import express from "express";
import {
  getEvents,
  getEventById,
  registerForEvent,
  getCalendarEvents,
  getMyRegisteredEvents,
  createEvent,
  googleFormRegistration,
getEventRegistrationStatus,
} from "../controllers/eventController.js";

const router = express.Router();

router.get("/", getEvents);
router.post("/", createEvent);

router.get("/calendar/all", getCalendarEvents);
router.get("/registered/:userId", getMyRegisteredEvents);
router.get("/:id", getEventById);
router.post(
  "/google-form-registration",
  googleFormRegistration,
);

router.get(
  "/:id/registration-status/:userId",
  getEventRegistrationStatus,
);
router.post("/:id/register", registerForEvent);

export default router;