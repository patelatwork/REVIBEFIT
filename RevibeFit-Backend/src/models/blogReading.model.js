import mongoose from "mongoose";

const blogReadingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only mark a blog as read once
blogReadingSchema.index({ user: 1, blogId: 1 }, { unique: true });

export const BlogReading = mongoose.model("BlogReading", blogReadingSchema);