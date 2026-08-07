import mongoose from "mongoose";

const notificationSchema =
  new mongoose.Schema(
    {
      userId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Registration",

        required: true,

        index: true,
      },

      campaignId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref:
          "NotificationCampaign",

        default: null,

        index: true,
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
        enum: [
          "event",
          "course",
          "reminder",
          "system",
          "feedback",
          "exam",
          "drive",
          "offer",
        ],
        default: "system",
      },

      data: {
        type: Object,
        default: {},
      },

      deliveryStatus: {
        type: String,
        enum: [
          "queued",
          "sent",
          "failed",
        ],
        default: "queued",
        index: true,
      },

      acceptedDeviceCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      rejectedDeviceCount: {
        type: Number,
        default: 0,
        min: 0,
      },

      openedAt: {
        type: Date,
        default: null,
        index: true,
      },

      openSource: {
        type: String,
        enum: [
          "",
          "system_tray",
        ],
        default: "",
      },

      read: {
        type: Boolean,
        default: false,
        index: true,
      },

      readAt: {
        type: Date,
        default: null,
      },

      sentAt: {
        type: Date,
        default: null,
      },

      failureReason: {
        type: String,
        default: "",
      },
    },
    {
      timestamps: true,
    },
  );

notificationSchema.index({
  userId: 1,
  createdAt: -1,
});

notificationSchema.index({
  userId: 1,
  read: 1,
});

notificationSchema.index({
  campaignId: 1,
  userId: 1,
});

export default (
  mongoose.models.Notification ||
  mongoose.model(
    "Notification",
    notificationSchema,
  )
);
