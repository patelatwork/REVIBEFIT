import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Follower is required"],
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Following user is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate follows
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });

export const Follow = mongoose.model("Follow", followSchema);
