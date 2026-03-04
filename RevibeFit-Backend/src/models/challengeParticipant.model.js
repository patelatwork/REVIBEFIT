import mongoose from "mongoose";

const challengeParticipantSchema = new mongoose.Schema(
  {
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: [true, "Challenge reference is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    userName: {
      type: String,
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
    },
    progressLog: [
      {
        value: { type: Number, required: true },
        note: { type: String, trim: true, maxlength: 500 },
        loggedAt: { type: Date, default: Date.now },
      },
    ],
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    rank: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One participation per user per challenge
challengeParticipantSchema.index({ challenge: 1, user: 1 }, { unique: true });
challengeParticipantSchema.index({ challenge: 1, progress: -1 }); // leaderboard
challengeParticipantSchema.index({ user: 1 });

export const ChallengeParticipant = mongoose.model(
  "ChallengeParticipant",
  challengeParticipantSchema
);
