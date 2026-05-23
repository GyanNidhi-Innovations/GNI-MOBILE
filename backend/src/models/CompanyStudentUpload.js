import mongoose from "mongoose";

// Subdocument schema for storing submitted answers
const submittedAnswerSchema = new mongoose.Schema(
  {
    question_id: {
      type: Number,
      required: true,
    },

    question_type: {
      type: String,
      default: "",
    },

    // Backward-compatible field for MCQ_SINGLE and older save logic
    selected_option: {
      type: String,
      default: "",
    },

    // New field for MCQ_MULTI
    selected_options: {
      type: [String],
      default: [],
    },

    // New field for FILL_BLANK, SHORT_TEXT, LONG_TEXT
    text_answer: {
      type: String,
      default: "",
    },

    // New field for NUMERIC
    numeric_answer: {
      type: Number,
      default: null,
    },

    is_correct: {
      type: Boolean,
      default: null,
    },

    marks_awarded: {
      type: Number,
      default: 0,
    },

    auto_evaluated: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const companyStudentUploadSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company_form",
      required: true,
      index: true,
    },

    batchName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamMaster",
      required: true,
      index: true,
    },

    emailOriginal: {
      type: String,
      default: "",
      trim: true,
    },

    emailNormalized: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    emailHash: {
      type: String,
      default: "",
      index: true,
    },

    isValid: {
      type: Boolean,
      default: true,
    },

    invalidReason: {
      type: String,
      default: "",
    },

    isRegistered: {
      type: Boolean,
      default: false,
    },

    inviteStatus: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED", "SKIPPED"],
      default: "PENDING",
    },

    inviteError: {
      type: String,
      default: "",
    },

    invitedAt: {
      type: Date,
      default: null,
    },

    batchScheduledAt: {
      type: Date,
      default: null,
    },

    studentScheduledAt: {
      type: Date,
      default: null,
    },

    scheduleMailStatus: {
      type: String,
      enum: ["NONE", "SENT", "FAILED"],
      default: "NONE",
    },

    scheduleMailError: {
      type: String,
      default: "",
    },

    scheduleMailSentAt: {
      type: Date,
      default: null,
    },

    webcamSessionId: {
      type: String,
      default: null,
    },

    score: {
      type: Number,
      default: null,
    },

    scoreUpdatedAt: {
      type: Date,
      default: null,
    },

    examLinkToken: {
      type: String,
      default: null,
    },

    examAccessUrl: {
      type: String,
      default: "",
    },

    /**
     * Kept only for backward compatibility.
     * Going forward, use ExamMaster.webcamEnabled as source of truth.
     */
    webcamEnabled: {
      type: Boolean,
      default: false,
    },

    examStatus: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED"],
      default: "NOT_STARTED",
      index: true,
    },

    examStartedAt: {
      type: Date,
      default: null,
    },

    examSubmittedAt: {
      type: Date,
      default: null,
    },

    timeLeftSeconds: {
      type: Number,
      default: null,
    },

    premisesJobId: {
      type: String,
      default: null,
      index: true,
    },

    premisesMergeStatus: {
      type: String,
      default: null,
    },

    lastVisitedQuestionIndex: {
      type: Number,
      default: 0,
    },

    visitedQuestions: {
      type: [Number],
      default: [],
    },

    submittedAnswers: {
      type: [submittedAnswerSchema],
      default: [],
      validate: {
        validator: function (value) {
          return value.every(
            (answer) =>
              answer.question_id !== undefined &&
              answer.question_id !== null
          );
        },
        message: "Each answer must have a valid question_id.",
      },
    },
  },
  { timestamps: true }
);

// Prevent duplicate student inside same company + batch + exam
companyStudentUploadSchema.index(
  { companyId: 1, batchName: 1, emailNormalized: 1, examId: 1 },
  { unique: true }
);

// Unique exam link token only when present
companyStudentUploadSchema.index(
  { examLinkToken: 1 },
  { unique: true, sparse: true }
);

// Unique webcam session only when present
companyStudentUploadSchema.index(
  { webcamSessionId: 1 },
  { unique: true, sparse: true }
);

// Faster company exam dashboard/student filtering
companyStudentUploadSchema.index({
  companyId: 1,
  examId: 1,
  examStatus: 1,
});

// Faster batch schedule/student listing
companyStudentUploadSchema.index({
  companyId: 1,
  batchName: 1,
  batchScheduledAt: 1,
});

const CompanyStudentUpload =
  mongoose.models.CompanyStudentUpload ||
  mongoose.model("CompanyStudentUpload", companyStudentUploadSchema);

export default CompanyStudentUpload;