import mongoose from "mongoose";

const notificationDeliverySchema =
  new mongoose.Schema(
    {
      campaignId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref:
          "NotificationCampaign",

        required: true,

        index: true,
      },

      notificationId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Notification",

        default: null,

        index: true,
      },

      userId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Registration",

        default: null,

        index: true,
      },

      installationId: {
        type: String,
        default: "",
        trim: true,
      },

      deviceName: {
        type: String,
        default: "",
        trim: true,
      },

      platform: {
        type: String,
        enum: [
          "android",
          "ios",
          "unknown",
        ],
        default: "unknown",
      },

      tokenSuffix: {
        type: String,
        default: "",
        trim: true,
      },

      fcmStatus: {
        type: String,
        enum: [
          "accepted",
          "rejected",
        ],
        required: true,
        index: true,
      },

      fcmMessageId: {
        type: String,
        default: "",
        trim: true,
      },

      errorCode: {
        type: String,
        default: "",
        trim: true,
      },

      errorMessage: {
        type: String,
        default: "",
        trim: true,
      },

      processedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    },
  );

notificationDeliverySchema.index(
  {
    campaignId: 1,
    installationId: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      installationId: {
        $type: "string",
      },
    },
  },
);

notificationDeliverySchema.index({
  campaignId: 1,
  userId: 1,
});

export default (
  mongoose.models
    .NotificationDelivery ||
  mongoose.model(
    "NotificationDelivery",
    notificationDeliverySchema,
  )
);
