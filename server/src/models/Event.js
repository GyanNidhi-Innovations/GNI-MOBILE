import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  location: String,
  organizer: String,
  seats: Number,
  registeredUsers: [{ type: mongoose.Schema.Types.ObjectId }],
});

export default mongoose.model("Event", EventSchema);