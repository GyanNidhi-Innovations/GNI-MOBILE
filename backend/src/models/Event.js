import mongoose from "mongoose";

const SpeakerSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      image: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      _id: false,
    },
  );

const SessionSchema =
  new mongoose.Schema(
    {
      label: {
        type: String,
        required: true,
        trim: true,
      },

      startAt: {
        type: Date,
        required: true,
      },

      zoomRegistrationUrl: {
        type: String,
        required: true,
        trim: true,
      },
    },
    {
      _id: false,
    },
  );

const FormRegistrationSchema =
  new mongoose.Schema(
    {
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      emailNormalized: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      fullName: {
        type: String,
        default: "",
        trim: true,
      },

      phone: {
        type: String,
        default: "",
        trim: true,
      },

      googleResponseId: {
        type: String,
        default: "",
        trim: true,
      },

      userId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Registration",

        default: null,
      },

      source: {
        type: String,

        enum: [
          "google_form",
          "admin",
        ],

        default: "google_form",
      },

      submittedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: false,
    },
  );

const EventSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        required: true,
        trim: true,
      },

      eventType: {
        type: String,
        default: "Event",
        trim: true,
      },

      /*
       * Kept for existing Home and
       * Calendar compatibility.
       */
      date: {
        type: Date,
        required: true,
        index: true,
      },

      startAt: {
        type: Date,
        required: true,
        index: true,
      },

      endAt: {
        type: Date,
        required: true,
        index: true,
      },

      timezone: {
        type: String,
        default: "Asia/Kolkata",
        trim: true,
      },

      location: {
        type: String,
        required: true,
        trim: true,
      },

      organizer: {
        type: String,
        required: true,
        trim: true,
      },

      image: {
        type: String,
        required: true,
        trim: true,
      },

      registrationUrl: {
        type: String,
        required: true,
        trim: true,
      },

      speakers: {
        type: [SpeakerSchema],
        default: [],
      },

      sessions: {
        type: [SessionSchema],
        default: [],
      },

      status: {
        type: String,

        enum: [
          "draft",
          "published",
          "closed",
          "cancelled",
          "completed",
        ],

        default: "published",

        index: true,
      },

      registrations: {
        type: [
          FormRegistrationSchema,
        ],

        default: [],
      },

      registeredUsers: [
        {
          type:
            mongoose.Schema.Types
              .ObjectId,

          ref: "Registration",
        },
      ],
    },
    {
      timestamps: true,
    },
  );

EventSchema.index({
  status: 1,
  startAt: 1,
});

export default (
  mongoose.models.Event ||
  mongoose.model(
    "Event",
    EventSchema,
  )
);