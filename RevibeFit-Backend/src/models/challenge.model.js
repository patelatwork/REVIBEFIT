import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Challenge title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title must be less than 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Challenge description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [5000, "Description must be less than 5000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["strength", "cardio", "flexibility", "nutrition", "mindfulness", "general"],
    },
    coverImage: {
      type: String, // file path
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorName: {
      type: String,
      required: true,
    },
    creatorType: {
      type: String,
      required: true,
      enum: ["trainer", "admin"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    goalType: {
      type: String,
      required: true,
      enum: ["count", "duration", "streak"],
      // count: e.g., 100 pushups total
      // duration: e.g., 30 minutes of yoga daily
      // streak: e.g., 30 consecutive days
    },
    goalTarget: {
      type: Number,
      required: [true, "Goal target is required"],
      min: [1, "Goal target must be at least 1"],
    },
    goalUnit: {
      type: String,
      required: true,
      // e.g., "pushups", "minutes", "days", "km", "steps"
    },
    rules: [
      {
        type: String,
        trim: true,
      },
    ],
    participantsCount: {
      type: Number,
      default: 0,
    },
    maxParticipants: {
      type: Number,
      default: null, // null means unlimited
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
challengeSchema.index({ isActive: 1, startDate: -1 });
challengeSchema.index({ category: 1 });
challengeSchema.index({ createdBy: 1 });
challengeSchema.index({ endDate: 1 });

export const Challenge = mongoose.model("Challenge", challengeSchema);
