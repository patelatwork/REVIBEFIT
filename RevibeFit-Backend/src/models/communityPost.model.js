import mongoose from "mongoose";

const communityPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    authorName: {
      type: String,
      required: true,
    },
    authorType: {
      type: String,
      required: true,
      enum: ["fitness-enthusiast", "trainer", "lab-partner", "admin", "manager"],
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      minlength: [1, "Post content cannot be empty"],
      maxlength: [5000, "Post content must be less than 5000 characters"],
    },
    category: {
      type: String,
      required: [true, "Post category is required"],
      enum: ["tip", "question", "transformation", "motivation", "discussion", "success-story"],
      default: "discussion",
    },
    images: [
      {
        type: String, // file paths
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    reactionsCount: {
      like: { type: Number, default: 0 },
      love: { type: Number, default: 0 },
      fire: { type: Number, default: 0 },
      clap: { type: Number, default: 0 },
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
communityPostSchema.index({ author: 1, createdAt: -1 });
communityPostSchema.index({ category: 1, createdAt: -1 });
communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ isPinned: -1, createdAt: -1 });
communityPostSchema.index({ tags: 1 });

export const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);
