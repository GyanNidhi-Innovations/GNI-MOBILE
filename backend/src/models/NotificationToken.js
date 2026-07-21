import mongoose from "mongoose";

const notificationTokenSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /*
       * Permanently identifies one installed copy
       * of the mobile application.
       *
       * This remains unchanged when the FCM token
       * changes.
       */
      installationId: {
        type: String,
        required: true,
        trim: true,
      },

      /*
       * Native Firebase registration token.
       *
       * It can change while installationId remains
       * unchanged.
       */
      token: {
        type: String,
        required: true,
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

      deviceName: {
        type: String,
        default: "",
        trim: true,
      },

      isActive: {
        type: Boolean,
        default: true,
        index: true,
      },

      lastSeenAt: {
        type: Date,
        default: Date.now,
        index: true,
      },

      lastFailedAt: {
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

/*
 * One record per installed application.
 *
 * The partial index permits old development
 * documents that do not yet have installationId.
 */
notificationTokenSchema.index(
  {
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

/*
 * One Firebase registration token must not be
 * stored in more than one record.
 */
notificationTokenSchema.index(
  {
    token: 1,
  },
  {
    unique: true,
  },
);

notificationTokenSchema.index({
  userId: 1,
  isActive: 1,
});

export default mongoose.model(
  "NotificationToken",
  notificationTokenSchema,
);