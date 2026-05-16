import express from "express";
import { premisesImageUpload } from "../middleware/premisesUpload.js";
import {
  premisesHealth,
  createPremisesSession,
  getHireAIActiveInterview,
  validateHireAIPremises,
  getHireAIValidationStatus,
  validateExamPremises,
  getExamValidationStatus,
} from "../controllers/premisesController.js";

const router = express.Router();

router.get("/health", premisesHealth);
router.post("/session", createPremisesSession);
router.get("/hireai/active-interview", getHireAIActiveInterview);
router.post(
  "/hireai/validate",
  premisesImageUpload.single("file"),
  validateHireAIPremises
);
router.get("/hireai/status", getHireAIValidationStatus);
router.post(
  "/exam/validate",
  premisesImageUpload.single("file"),
  validateExamPremises
);
router.get("/exam/status", getExamValidationStatus);

export default router;