import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["event", "course", "reminder", "system", "feedback"],
      default: "system",
    },
    data: {
      type: Object,
      default: {},
    },
    deliveryStatus: {
      type: String,
      enum: ["queued", "sent", "failed"],
      default: "queued",
    },
    read: {
      type: Boolean,
      default: false,
    },
    sentAt: Date,
    failureReason: String,
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);