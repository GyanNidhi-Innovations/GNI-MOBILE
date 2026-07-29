import mongoose from "mongoose";

const refreshSessionSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Registration",
        required: true,
        index: true,
      },

      tokenHash: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      expiresAt: {
        type: Date,
        required: true,
        index: true,
      },

      revokedAt: {
        type: Date,
        default: null,
        index: true,
      },

      replacedByTokenHash: {
        type: String,
        default: "",
      },

      userAgent: {
        type: String,
        default: "",
      },

      ipAddress: {
        type: String,
        default: "",
      },

      lastUsedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    },
  );

/*
 * MongoDB automatically removes expired sessions.
 * Cleanup is asynchronous and may not happen at the
 * exact expiration second, so controllers must still
 * check expiresAt.
 */
refreshSessionSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
);

export default (
  mongoose.models.RefreshSession ||
  mongoose.model(
    "RefreshSession",
    refreshSessionSchema,
  )
);