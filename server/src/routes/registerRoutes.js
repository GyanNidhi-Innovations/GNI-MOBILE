// routes/registerRoutes.js
import express from "express";
import upload from "../middleware/upload.js";
import {
  loginRegistrationUser,
  registerUser,
} from "../controllers/registerController.js";

const router = express.Router();

router.post("/login", loginRegistrationUser);
router.post("/signup", upload.single("resume"), registerUser);

export default router;