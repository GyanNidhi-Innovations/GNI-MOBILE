import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    name: String,
    email: { type: String, unique: true },
    phone: String,
    college: String,
    year: String,
    branch: String,
    skills: String,
    resume: String,
    resumeSpacesKey: String,
    resumeOriginalName: String,
    resumeStoredName: String,
    resumeUpdatedAt: Date,
    degree: String,
    passoutYear: Number,
    joiningyear: Number,
    specialization: String,
    locationPreferences: String,
    currentCompany: String,
    currentRole: String,
    experience: String,
    careerGoals: String,
    password: { type: String, required: true },
    
    resetPasswordOtp: {
    type: String,
    select: false,
  },
  
  resetPasswordOtpExpires: {
    type: Date,
    select: false,
  },
  
  resetPasswordOtpAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  
  resetPasswordOtpSentAt: {
    type: Date,
    select: false,
  },

    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
    bufferCommands: false,
    autoCreate: false,
  }
);

export default mongoose.models.Registration ||
  mongoose.model("Registration", RegistrationSchema);