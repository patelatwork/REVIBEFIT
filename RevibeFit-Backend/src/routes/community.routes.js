import { Router } from "express";
import {
  createPost,
  getFeed,
  getPostById,
  deletePost,
  addComment,
  getComments,
  deleteComment,
  toggleReaction,
  toggleFollow,
  getFollowers,
  getFollowing,
  isFollowing,
  getPersonalizedFeed,
  getUserPosts,
  getCommunityStats,
} from "../controllers/community.controller.js";
import {
  createChallenge,
  getChallenges,
  getChallengeById,
  joinChallenge,
  logProgress,
  getLeaderboard,
  deleteChallenge,
} from "../controllers/challenge.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadImage } from "../middlewares/multer.middleware.js";

const router = Router();

// ─── Helper: optionally authenticate (attach user if token exists) ─────────
const optionalAuth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      const jwt = await import("jsonwebtoken");
      const config = (await import("../config/index.js")).default;
      const { User } = await import("../models/user.model.js");
      const decoded = jwt.default.verify(token, config.jwtSecret);
      const user = await User.findById(decoded._id).select(
        "-password -refreshToken"
      );
      if (user && user.isActive && !user.isSuspended) {
        req.user = user;
      }
    }
  } catch {
    // Not authenticated — that's fine for public routes
  }
  next();
};

// ═════════════════════════════════════════════════════════════════════════════
//  COMMUNITY POSTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/community/stats:
 *   get:
 *     summary: Get community statistics
 *     tags: [Community]
 *     responses:
 *       200:
 *         description: Community stats
 */
router.route("/stats").get(getCommunityStats);

/**
 * @swagger
 * /api/community/posts:
 *   get:
 *     summary: Get community feed
 *     tags: [Community]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [tip, question, transformation, motivation, discussion, success-story]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, popular]
 *     responses:
 *       200:
 *         description: Community feed
 */
router.route("/posts").get(optionalAuth, getFeed);

/**
 * @swagger
 * /api/community/posts:
 *   post:
 *     summary: Create a new community post
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Post created
 */
router
  .route("/posts")
  .post(verifyJWT, uploadImage.array("images", 5), createPost);

/**
 * @swagger
 * /api/community/my-feed:
 *   get:
 *     summary: Get personalized feed (posts from followed users)
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personalized feed
 */
router.route("/my-feed").get(verifyJWT, getPersonalizedFeed);

/**
 * @swagger
 * /api/community/posts/{postId}:
 *   get:
 *     summary: Get a single post
 *     tags: [Community]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post details
 */
router.route("/posts/:postId").get(optionalAuth, getPostById);

/**
 * @swagger
 * /api/community/posts/{postId}:
 *   delete:
 *     summary: Delete own post
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Post deleted
 */
router.route("/posts/:postId").delete(verifyJWT, deletePost);

// ═════════════════════════════════════════════════════════════════════════════
//  COMMENTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/community/posts/{postId}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Comment added
 */
router.route("/posts/:postId/comments").post(verifyJWT, addComment);

/**
 * @swagger
 * /api/community/posts/{postId}/comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Community]
 *     responses:
 *       200:
 *         description: Comments list
 */
router.route("/posts/:postId/comments").get(getComments);

/**
 * @swagger
 * /api/community/comments/{commentId}:
 *   delete:
 *     summary: Delete own comment
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comment deleted
 */
router.route("/comments/:commentId").delete(verifyJWT, deleteComment);

// ═════════════════════════════════════════════════════════════════════════════
//  REACTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/community/react:
 *   post:
 *     summary: Toggle reaction on a post or comment
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetId
 *               - targetType
 *               - reactionType
 *             properties:
 *               targetId:
 *                 type: string
 *               targetType:
 *                 type: string
 *                 enum: [post, comment]
 *               reactionType:
 *                 type: string
 *                 enum: [like, love, fire, clap]
 *     responses:
 *       200:
 *         description: Reaction toggled
 */
router.route("/react").post(verifyJWT, toggleReaction);

// ═════════════════════════════════════════════════════════════════════════════
//  FOLLOW SYSTEM
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/community/follow/{userId}:
 *   post:
 *     summary: Toggle follow/unfollow a user
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Follow toggled
 */
router.route("/follow/:userId").post(verifyJWT, toggleFollow);

router.route("/followers/:userId").get(getFollowers);
router.route("/following/:userId").get(getFollowing);
router.route("/is-following/:userId").get(verifyJWT, isFollowing);
router.route("/user/:userId/posts").get(getUserPosts);

// ═════════════════════════════════════════════════════════════════════════════
//  CHALLENGES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/community/challenges:
 *   get:
 *     summary: Get all challenges
 *     tags: [Community - Challenges]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, upcoming, completed]
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *     responses:
 *       200:
 *         description: List of challenges
 */
router.route("/challenges").get(optionalAuth, getChallenges);

/**
 * @swagger
 * /api/community/challenges:
 *   post:
 *     summary: Create a new fitness challenge
 *     tags: [Community - Challenges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Challenge created
 */
router
  .route("/challenges")
  .post(verifyJWT, uploadImage.single("coverImage"), createChallenge);

router.route("/challenges/:challengeId").get(optionalAuth, getChallengeById);
router.route("/challenges/:challengeId").delete(verifyJWT, deleteChallenge);
router.route("/challenges/:challengeId/join").post(verifyJWT, joinChallenge);
router.route("/challenges/:challengeId/progress").post(verifyJWT, logProgress);
router.route("/challenges/:challengeId/leaderboard").get(getLeaderboard);

export default router;
