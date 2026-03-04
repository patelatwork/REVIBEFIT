import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { CommunityPost } from "../models/communityPost.model.js";
import { Comment } from "../models/comment.model.js";
import { Reaction } from "../models/reaction.model.js";
import { Follow } from "../models/follow.model.js";
import { User } from "../models/user.model.js";

// ═════════════════════════════════════════════════════════════════════════════
//  POSTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Create a new community post
 * @route   POST /api/community/posts
 * @access  Private (any authenticated user)
 */
export const createPost = asyncHandler(async (req, res) => {
  const { content, category, tags } = req.body;
  const userId = req.user._id;

  // Handle image uploads (multiple)
  const images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const filePath = file.path.split("public")[1] || file.path;
      images.push(filePath.replace(/\\/g, "/").replace(/^\//, ""));
    }
  }

  const post = await CommunityPost.create({
    author: userId,
    authorName: req.user.name,
    authorType: req.user.userType,
    content,
    category: category || "discussion",
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim())) : [],
    images,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, post, "Post created successfully"));
});

/**
 * @desc    Get community feed (all posts, paginated)
 * @route   GET /api/community/posts
 * @access  Public
 */
export const getFeed = asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 10, tag, sort = "latest" } = req.query;

  const filter = { isVisible: true };
  if (category) filter.category = category;
  if (tag) filter.tags = { $in: [tag.toLowerCase()] };

  let sortOption = { isPinned: -1, createdAt: -1 };
  if (sort === "popular") {
    sortOption = { isPinned: -1, likesCount: -1, createdAt: -1 };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [posts, total] = await Promise.all([
    CommunityPost.find(filter)
      .populate("author", "name userType")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit)),
    CommunityPost.countDocuments(filter),
  ]);

  // If user is authenticated, get their reactions for these posts
  let userReactions = {};
  if (req.user) {
    const postIds = posts.map((p) => p._id);
    const reactions = await Reaction.find({
      user: req.user._id,
      targetId: { $in: postIds },
      targetType: "post",
    });
    reactions.forEach((r) => {
      userReactions[r.targetId.toString()] = r.type;
    });
  }

  const postsWithMeta = posts.map((post) => ({
    ...post.toObject(),
    userReaction: userReactions[post._id.toString()] || null,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts: postsWithMeta,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Feed retrieved successfully"
    )
  );
});

/**
 * @desc    Get a single post by ID
 * @route   GET /api/community/posts/:postId
 * @access  Public
 */
export const getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await CommunityPost.findById(postId).populate(
    "author",
    "name userType"
  );

  if (!post || !post.isVisible) {
    throw new ApiError(404, "Post not found");
  }

  // Get user's reaction if authenticated
  let userReaction = null;
  if (req.user) {
    const reaction = await Reaction.findOne({
      user: req.user._id,
      targetId: postId,
      targetType: "post",
    });
    if (reaction) userReaction = reaction.type;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { ...post.toObject(), userReaction },
      "Post retrieved successfully"
    )
  );
});

/**
 * @desc    Delete own post
 * @route   DELETE /api/community/posts/:postId
 * @access  Private (post author or admin)
 */
export const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await CommunityPost.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (
    post.author.toString() !== userId.toString() &&
    req.user.userType !== "admin"
  ) {
    throw new ApiError(403, "You can only delete your own posts");
  }

  // Delete associated comments and reactions
  await Promise.all([
    Comment.deleteMany({ post: postId }),
    Reaction.deleteMany({ targetId: postId, targetType: "post" }),
  ]);

  await CommunityPost.findByIdAndDelete(postId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Post deleted successfully"));
});

// ═════════════════════════════════════════════════════════════════════════════
//  COMMENTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Add a comment to a post
 * @route   POST /api/community/posts/:postId/comments
 * @access  Private
 */
export const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content, parentComment } = req.body;
  const userId = req.user._id;

  const post = await CommunityPost.findById(postId);
  if (!post || !post.isVisible) {
    throw new ApiError(404, "Post not found");
  }

  // If replying to a comment, verify parent exists
  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    if (!parent || parent.post.toString() !== postId) {
      throw new ApiError(404, "Parent comment not found");
    }
  }

  const comment = await Comment.create({
    post: postId,
    author: userId,
    authorName: req.user.name,
    authorType: req.user.userType,
    content,
    parentComment: parentComment || null,
  });

  // Increment comment count on post
  await CommunityPost.findByIdAndUpdate(postId, {
    $inc: { commentsCount: 1 },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

/**
 * @desc    Get comments for a post
 * @route   GET /api/community/posts/:postId/comments
 * @access  Public
 */
export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const post = await CommunityPost.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get top-level comments with their replies
  const [comments, total] = await Promise.all([
    Comment.find({ post: postId, parentComment: null, isVisible: true })
      .populate("author", "name userType")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Comment.countDocuments({
      post: postId,
      parentComment: null,
      isVisible: true,
    }),
  ]);

  // Get replies for all top-level comments
  const commentIds = comments.map((c) => c._id);
  const replies = await Comment.find({
    parentComment: { $in: commentIds },
    isVisible: true,
  })
    .populate("author", "name userType")
    .sort({ createdAt: 1 });

  // Group replies by parent
  const repliesMap = {};
  replies.forEach((reply) => {
    const parentId = reply.parentComment.toString();
    if (!repliesMap[parentId]) repliesMap[parentId] = [];
    repliesMap[parentId].push(reply);
  });

  const commentsWithReplies = comments.map((comment) => ({
    ...comment.toObject(),
    replies: repliesMap[comment._id.toString()] || [],
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments: commentsWithReplies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Comments retrieved successfully"
    )
  );
});

/**
 * @desc    Delete own comment
 * @route   DELETE /api/community/comments/:commentId
 * @access  Private (comment author or admin)
 */
export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (
    comment.author.toString() !== userId.toString() &&
    req.user.userType !== "admin"
  ) {
    throw new ApiError(403, "You can only delete your own comments");
  }

  // Delete replies to this comment
  const repliesCount = await Comment.countDocuments({
    parentComment: commentId,
  });
  await Comment.deleteMany({ parentComment: commentId });
  await Reaction.deleteMany({ targetId: commentId, targetType: "comment" });

  // Decrement comment count (this comment + its replies)
  await CommunityPost.findByIdAndUpdate(comment.post, {
    $inc: { commentsCount: -(1 + repliesCount) },
  });

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

// ═════════════════════════════════════════════════════════════════════════════
//  REACTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Toggle reaction on a post or comment
 * @route   POST /api/community/react
 * @access  Private
 */
export const toggleReaction = asyncHandler(async (req, res) => {
  const { targetId, targetType, reactionType } = req.body;
  const userId = req.user._id;

  if (!["post", "comment"].includes(targetType)) {
    throw new ApiError(400, "Invalid target type");
  }
  if (!["like", "love", "fire", "clap"].includes(reactionType)) {
    throw new ApiError(400, "Invalid reaction type");
  }

  // Verify target exists
  const Model = targetType === "post" ? CommunityPost : Comment;
  const targetModel = targetType === "post" ? "CommunityPost" : "Comment";
  const target = await Model.findById(targetId);
  if (!target) {
    throw new ApiError(404, `${targetType} not found`);
  }

  // Check existing reaction
  const existingReaction = await Reaction.findOne({
    user: userId,
    targetId,
    targetType,
  });

  if (existingReaction) {
    if (existingReaction.type === reactionType) {
      // Same reaction → remove it (toggle off)
      await Reaction.findByIdAndDelete(existingReaction._id);

      if (targetType === "post") {
        await CommunityPost.findByIdAndUpdate(targetId, {
          $inc: {
            likesCount: -1,
            [`reactionsCount.${reactionType}`]: -1,
          },
        });
      } else {
        await Comment.findByIdAndUpdate(targetId, {
          $inc: { likesCount: -1 },
        });
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, { reacted: false, type: null }, "Reaction removed")
        );
    } else {
      // Different reaction → update it
      const oldType = existingReaction.type;
      existingReaction.type = reactionType;
      await existingReaction.save();

      if (targetType === "post") {
        await CommunityPost.findByIdAndUpdate(targetId, {
          $inc: {
            [`reactionsCount.${oldType}`]: -1,
            [`reactionsCount.${reactionType}`]: 1,
          },
        });
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { reacted: true, type: reactionType },
            "Reaction updated"
          )
        );
    }
  } else {
    // New reaction
    await Reaction.create({
      user: userId,
      targetId,
      targetType,
      targetModel,
      type: reactionType,
    });

    if (targetType === "post") {
      await CommunityPost.findByIdAndUpdate(targetId, {
        $inc: {
          likesCount: 1,
          [`reactionsCount.${reactionType}`]: 1,
        },
      });
    } else {
      await Comment.findByIdAndUpdate(targetId, {
        $inc: { likesCount: 1 },
      });
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { reacted: true, type: reactionType },
          "Reaction added"
        )
      );
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  FOLLOW SYSTEM
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Toggle follow a user
 * @route   POST /api/community/follow/:userId
 * @access  Private
 */
export const toggleFollow = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user._id;

  if (userId === followerId.toString()) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  const existingFollow = await Follow.findOne({
    follower: followerId,
    following: userId,
  });

  if (existingFollow) {
    await Follow.findByIdAndDelete(existingFollow._id);
    return res
      .status(200)
      .json(new ApiResponse(200, { following: false }, "Unfollowed successfully"));
  } else {
    await Follow.create({
      follower: followerId,
      following: userId,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, { following: true }, "Followed successfully"));
  }
});

/**
 * @desc    Get followers of a user
 * @route   GET /api/community/followers/:userId
 * @access  Public
 */
export const getFollowers = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const followers = await Follow.find({ following: userId })
    .populate("follower", "name userType")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        followers: followers.map((f) => f.follower),
        count: followers.length,
      },
      "Followers retrieved successfully"
    )
  );
});

/**
 * @desc    Get users that a user is following
 * @route   GET /api/community/following/:userId
 * @access  Public
 */
export const getFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const following = await Follow.find({ follower: userId })
    .populate("following", "name userType")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        following: following.map((f) => f.following),
        count: following.length,
      },
      "Following list retrieved successfully"
    )
  );
});

/**
 * @desc    Check if current user follows another user
 * @route   GET /api/community/is-following/:userId
 * @access  Private
 */
export const isFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user._id;

  const follow = await Follow.findOne({
    follower: followerId,
    following: userId,
  });

  return res.status(200).json(
    new ApiResponse(200, { isFollowing: !!follow }, "Follow status retrieved")
  );
});

/**
 * @desc    Get personalized feed (posts from followed users)
 * @route   GET /api/community/my-feed
 * @access  Private
 */
export const getPersonalizedFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user._id;

  // Get list of users the current user follows
  const following = await Follow.find({ follower: userId }).select("following");
  const followingIds = following.map((f) => f.following);

  // Include own posts + followed users' posts
  const filter = {
    isVisible: true,
    author: { $in: [...followingIds, userId] },
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [posts, total] = await Promise.all([
    CommunityPost.find(filter)
      .populate("author", "name userType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    CommunityPost.countDocuments(filter),
  ]);

  // Get user reactions
  const postIds = posts.map((p) => p._id);
  const reactions = await Reaction.find({
    user: userId,
    targetId: { $in: postIds },
    targetType: "post",
  });
  const userReactions = {};
  reactions.forEach((r) => {
    userReactions[r.targetId.toString()] = r.type;
  });

  const postsWithMeta = posts.map((post) => ({
    ...post.toObject(),
    userReaction: userReactions[post._id.toString()] || null,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts: postsWithMeta,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Personalized feed retrieved successfully"
    )
  );
});

/**
 * @desc    Get posts by a specific user
 * @route   GET /api/community/user/:userId/posts
 * @access  Public
 */
export const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [posts, total] = await Promise.all([
    CommunityPost.find({ author: userId, isVisible: true })
      .populate("author", "name userType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    CommunityPost.countDocuments({ author: userId, isVisible: true }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "User posts retrieved successfully"
    )
  );
});

/**
 * @desc    Get community stats
 * @route   GET /api/community/stats
 * @access  Public
 */
export const getCommunityStats = asyncHandler(async (req, res) => {
  const [totalPosts, totalMembers, totalComments, categoryStats] =
    await Promise.all([
      CommunityPost.countDocuments({ isVisible: true }),
      CommunityPost.distinct("author").then((authors) => authors.length),
      Comment.countDocuments({ isVisible: true }),
      CommunityPost.aggregate([
        { $match: { isVisible: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalPosts,
        totalMembers,
        totalComments,
        categoryBreakdown: categoryStats,
      },
      "Community stats retrieved successfully"
    )
  );
});
