import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Blog } from "../models/blog.model.js";
import { BlogReading } from "../models/blogReading.model.js";
import { User } from "../models/user.model.js";
import { USER_TYPES } from "../constants.js";
import path from "path";

/**
 * @desc    Create a new blog post
 * @route   POST /api/blogs
 * @access  Private (Trainer only)
 */
export const createBlog = asyncHandler(async (req, res) => {
  const { title, content, category } = req.body;
  const trainerId = req.user._id;

  // Validate trainer
  const trainer = await User.findById(trainerId);
  if (!trainer || trainer.userType !== USER_TYPES.TRAINER) {
    throw new ApiError(403, "Only trainers can create blog posts");
  }

  // Check if thumbnail was uploaded
  if (!req.file) {
    throw new ApiError(400, "Thumbnail image is required");
  }

  // Get relative path for the thumbnail (remove absolute path, keep only public/temp/...)
  const thumbnailPath = req.file.path.split('public')[1] || req.file.path;
  const normalizedPath = thumbnailPath.replace(/\\/g, '/').replace(/^\//, '');

  // Create blog
  const blog = await Blog.create({
    title,
    content,
    category,
    thumbnail: normalizedPath,
    author: trainerId,
    authorName: trainer.name,
  });

  return res.status(201).json(
    new ApiResponse(201, blog, "Blog post created successfully")
  );
});

/**
 * @desc    Get all published blogs
 * @route   GET /api/blogs
 * @access  Public
 */
export const getAllBlogs = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const filter = { isPublished: true };
  if (category) {
    filter.category = category;
  }

  const blogs = await Blog.find(filter)
    .populate("author", "name specialization")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, blogs, "Blogs retrieved successfully")
  );
});

/**
 * @desc    Get single blog by ID
 * @route   GET /api/blogs/:id
 * @access  Public
 */
export const getBlogById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id).populate(
    "author",
    "name specialization email"
  );

  if (!blog || !blog.isPublished) {
    throw new ApiError(404, "Blog post not found");
  }

  return res.status(200).json(
    new ApiResponse(200, blog, "Blog retrieved successfully")
  );
});

/**
 * @desc    Get blogs by trainer (for trainer dashboard)
 * @route   GET /api/blogs/trainer/my-blogs
 * @access  Private (Trainer only)
 */
export const getTrainerBlogs = asyncHandler(async (req, res) => {
  const trainerId = req.user._id;

  const blogs = await Blog.find({ author: trainerId }).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, blogs, "Trainer blogs retrieved successfully")
  );
});

/**
 * @desc    Update blog post
 * @route   PUT /api/blogs/:id
 * @access  Private (Trainer - own blogs only)
 */
export const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, category, isPublished } = req.body;
  const trainerId = req.user._id;

  const blog = await Blog.findById(id);

  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }

  // Check if the trainer owns this blog
  if (blog.author.toString() !== trainerId.toString()) {
    throw new ApiError(403, "You can only edit your own blog posts");
  }

  // Update fields
  if (title) blog.title = title;
  if (content) blog.content = content;
  if (category) blog.category = category;
  if (typeof isPublished !== "undefined") blog.isPublished = isPublished;

  // Update thumbnail if new file uploaded
  if (req.file) {
    const thumbnailPath = req.file.path.split('public')[1] || req.file.path;
    const normalizedPath = thumbnailPath.replace(/\\/g, '/').replace(/^\//, '');
    blog.thumbnail = normalizedPath;
  }

  await blog.save();

  return res.status(200).json(
    new ApiResponse(200, blog, "Blog post updated successfully")
  );
});

/**
 * @desc    Delete blog post
 * @route   DELETE /api/blogs/:id
 * @access  Private (Trainer - own blogs only)
 */
export const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trainerId = req.user._id;

  const blog = await Blog.findById(id);

  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }

  // Check if the trainer owns this blog
  if (blog.author.toString() !== trainerId.toString()) {
    throw new ApiError(403, "You can only delete your own blog posts");
  }

  await blog.deleteOne();

  return res.status(200).json(
    new ApiResponse(200, null, "Blog post deleted successfully")
  );
});

/**
 * @desc    Mark blog as read by user
 * @route   POST /api/blogs/:id/mark-read
 * @access  Private (Fitness Enthusiast)
 */
export const markBlogAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Check if blog exists
  const blog = await Blog.findById(id);
  if (!blog || !blog.isPublished) {
    throw new ApiError(404, "Blog post not found");
  }

  // Check if already marked as read
  const existingReading = await BlogReading.findOne({
    user: userId,
    blogId: id,
  });

  if (existingReading) {
    return res.status(200).json(
      new ApiResponse(200, existingReading, "Blog already marked as read")
    );
  }

  // Mark as read
  const blogReading = await BlogReading.create({
    user: userId,
    blogId: id,
  });

  return res.status(201).json(
    new ApiResponse(201, blogReading, "Blog marked as read successfully")
  );
});

/**
 * @desc    Get user's read blogs
 * @route   GET /api/blogs/user/read-blogs
 * @access  Private (Fitness Enthusiast)
 */
export const getUserReadBlogs = asyncHandler(async (req, res) => {
  console.log('getUserReadBlogs endpoint hit');
  console.log('User from request:', req.user);
  
  const userId = req.user._id;
  console.log('Searching for blogs read by user:', userId);

  const readBlogs = await BlogReading.find({ user: userId })
    .populate({
      path: "blogId",
      populate: {
        path: "author",
        select: "name specialization"
      }
    })
    .sort({ readAt: -1 });

  console.log('Raw readBlogs found:', readBlogs.length);

  // Filter out any null blogs (in case blog was deleted)
  const validReadBlogs = readBlogs.filter(reading => reading.blogId);
  
  console.log('Valid readBlogs after filtering:', validReadBlogs.length);

  return res.status(200).json(
    new ApiResponse(200, validReadBlogs, "Read blogs retrieved successfully")
  );
});

/**
 * @desc    Check if user has read a specific blog
 * @route   GET /api/blogs/:id/read-status
 * @access  Private (Fitness Enthusiast)
 */
export const getBlogReadStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const reading = await BlogReading.findOne({
    user: userId,
    blogId: id,
  });

  return res.status(200).json(
    new ApiResponse(200, { hasRead: !!reading, readAt: reading?.readAt }, "Read status retrieved")
  );
});
