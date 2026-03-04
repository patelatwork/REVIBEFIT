import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    targetType: {
      type: String,
      required: true,
      enum: ["post", "comment"],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Target ID is required"],
      refPath: "targetModel",
    },
    targetModel: {
      type: String,
      required: true,
      enum: ["CommunityPost", "Comment"],
    },
    type: {
      type: String,
      required: [true, "Reaction type is required"],
      enum: ["like", "love", "fire", "clap"],
      default: "like",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one reaction per user per target (user can only react once per post/comment)
reactionSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true });
reactionSchema.index({ targetId: 1, targetType: 1 });

export const Reaction = mongoose.model("Reaction", reactionSchema);
