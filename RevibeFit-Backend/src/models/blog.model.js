import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title must be less than 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Blog content is required"],
      minlength: [50, "Content must be at least 50 characters"],
    },
    category: {
      type: String,
      required: [true, "Blog category is required"],
      enum: ["Fitness Tips", "Nutrition", "Yoga", "Mental Wellness", "General"],
    },
    thumbnail: {
      type: String, // Will store file path
      required: [true, "Thumbnail image is required"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    authorName: {
      type: String,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for better query performance
blogSchema.index({ author: 1, createdAt: -1 });
blogSchema.index({ category: 1 });
blogSchema.index({ isPublished: 1 });

export const Blog = mongoose.model("Blog", blogSchema);
