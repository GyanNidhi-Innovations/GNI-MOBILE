import mongoose from "mongoose";

const notificationSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
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
      },

      read: {
        type: Boolean,
        default: false,
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

export default mongoose.model(
  "Notification",
  notificationSchema,
);