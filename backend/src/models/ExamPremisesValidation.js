import mongoose from "mongoose";

const examPremisesValidationSchema = new mongoose.Schema(
  {
    attempt: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    room: {
      type: String,
      required: true,
    },

    sessionId: {
      type: String,
    },

    validated: {
      type: Boolean,
      default: false,
    },

    confidence: {
      type: Number,
      default: 0,
    },

    checks: {
      person_present: Boolean,
      screen_present: Boolean,
      together_in_frame: Boolean,
      image_quality_ok: Boolean,
    },

    notes: {
      type: String,
      default: "",
    },

    fail_reason: {
      type: String,
      default: "",
    },

    verdict: {
      type: Object,
      default: {},
    },

    validatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "ExamPremisesValidation",
  examPremisesValidationSchema
);