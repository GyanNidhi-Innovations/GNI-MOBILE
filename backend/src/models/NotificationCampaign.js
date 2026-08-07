import mongoose from "mongoose";

const createdBySchema =
  new mongoose.Schema(
    {
      adminId: {
        type: String,
        default: "",
        trim: true,
      },

      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },
    },
    {
      _id: false,
    },
  );

const notificationCampaignSchema =
  new mongoose.Schema(
    {
      source: {
        type: String,
        enum: [
          "general",
          "event",
          "topic",
        ],
        default: "general",
        index: true,
      },

      targetType: {
        type: String,
        enum: [
          "all",
          "user",
          "topic",
        ],
        required: true,
        index: true,
      },

      targetValue: {
        type: String,
        default: "",
        trim: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      body: {
        type: String,
        required: true,
        trim: true,
      },

      type: {
        type: String,
        default: "system",
        trim: true,
        index: true,
      },

      screen: {
        type: String,
        default: "notifications",
        trim: true,
      },

      eventId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Event",

        default: null,

        index: true,
      },

      status: {
        type: String,

        enum: [
          "processing",
          "completed",
          "partial",
          "failed",
        ],

        default: "processing",

        index: true,
      },

      analyticsAvailable: {
        type: Boolean,
        default: true,
      },

      totalUsers: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalDevices: {
        type: Number,
        default: 0,
        min: 0,
      },

      acceptedDevices: {
        type: Number,
        default: 0,
        min: 0,
      },

      rejectedDevices: {
        type: Number,
        default: 0,
        min: 0,
      },

      acceptedUsers: {
        type: Number,
        default: 0,
        min: 0,
      },

      failedUsers: {
        type: Number,
        default: 0,
        min: 0,
      },

      invalidTokensDisabled: {
        type: Number,
        default: 0,
        min: 0,
      },

      topicMessageId: {
        type: String,
        default: "",
        trim: true,
      },

      failureReason: {
        type: String,
        default: "",
        trim: true,
      },

      createdBy: {
        type: createdBySchema,
        default: () => ({}),
      },

      startedAt: {
        type: Date,
        default: Date.now,
      },

      completedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    },
  );

notificationCampaignSchema.index({
  createdAt: -1,
});

notificationCampaignSchema.index({
  source: 1,
  createdAt: -1,
});

notificationCampaignSchema.index({
  status: 1,
  createdAt: -1,
});

export default (
  mongoose.models
    .NotificationCampaign ||
  mongoose.model(
    "NotificationCampaign",
    notificationCampaignSchema,
  )
);
