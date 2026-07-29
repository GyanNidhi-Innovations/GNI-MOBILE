import express from "express";

import {
  getProfile,
  updateProfile,
} from "../controllers/profileController.js";

import {
  requireAuth,
} from "../middleware/requireAuth.js";

const router =
  express.Router();

router.use(
  requireAuth,
);

router.get(
  "/:id",
  getProfile,
);

router.put(
  "/:id",
  updateProfile,
);

export default router;