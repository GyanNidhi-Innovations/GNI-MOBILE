import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    date: {
      type: Date,
      required: true,
    },

    location: {
      type: String,
      default: "",
    },

    organizer: {
      type: String,
      default: "",
    },

    image: {
      type: String, // 🔥 needed for your frontend cards
      default: "",
    },

    seats: {
  type: Number,
  default: null,
  min: 0
},

    registeredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Registration",
      },
    ],
  },
  {
    timestamps: true, // 🔥 adds createdAt, updatedAt
  }
);

export default mongoose.model("Event", EventSchema);