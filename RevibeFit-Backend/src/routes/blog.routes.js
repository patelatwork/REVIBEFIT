import { Router } from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  getTrainerBlogs,
  updateBlog,
  deleteBlog,
  markBlogAsRead,
  getUserReadBlogs,
  getBlogReadStatus,
} from "../controllers/blog.controller.js";
import { verifyJWT, verifyUserType } from "../middlewares/auth.middleware.js";
import { uploadImage } from "../middlewares/multer.middleware.js";
import { USER_TYPES } from "../constants.js";

const router = Router();

// ─── Public routes ────────────────────────────────────────

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Get all published blogs
 *     tags: [Blogs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of blogs
 */
router.route("/").get(getAllBlogs);

// ─── Fitness Enthusiast routes ────────────────────────────

/**
 * @swagger
 * /api/blogs/read-blogs:
 *   get:
 *     summary: Get blogs the current user has read
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of read blogs
 */
router.route("/read-blogs").get(
  verifyJWT,
  verifyUserType(USER_TYPES.FITNESS_ENTHUSIAST),
  getUserReadBlogs
);

/**
 * @swagger
 * /api/blogs/{id}:
 *   get:
 *     summary: Get a single blog by ID
 *     tags: [Blogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog details
 *       404:
 *         description: Blog not found
 */
router.route("/:id").get(getBlogById);

/**
 * @swagger
 * /api/blogs/{id}/mark-read:
 *   post:
 *     summary: Mark a blog as read
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog marked as read
 */
router.route("/:id/mark-read").post(
  verifyJWT,
  verifyUserType(USER_TYPES.FITNESS_ENTHUSIAST),
  markBlogAsRead
);

/**
 * @swagger
 * /api/blogs/{id}/read-status:
 *   get:
 *     summary: Check if current user has read a blog
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Read status boolean
 */
router.route("/:id/read-status").get(
  verifyJWT,
  verifyUserType(USER_TYPES.FITNESS_ENTHUSIAST),
  getBlogReadStatus
);

// ─── Trainer-only routes ──────────────────────────────────

/**
 * @swagger
 * /api/blogs:
 *   post:
 *     summary: Create a new blog (trainer only)
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Blog created
 */
router.route("/").post(
  verifyJWT,
  verifyUserType(USER_TYPES.TRAINER),
  uploadImage.single("thumbnail"),
  createBlog
);

/**
 * @swagger
 * /api/blogs/trainer/my-blogs:
 *   get:
 *     summary: Get blogs authored by the logged-in trainer
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trainer's blogs
 */
router.route("/trainer/my-blogs").get(
  verifyJWT,
  verifyUserType(USER_TYPES.TRAINER),
  getTrainerBlogs
);

/**
 * @swagger
 * /api/blogs/{id}:
 *   put:
 *     summary: Update a blog (trainer only)
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Blog updated
 *   delete:
 *     summary: Delete a blog (trainer only)
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog deleted
 */
router.route("/:id").put(
  verifyJWT,
  verifyUserType(USER_TYPES.TRAINER),
  uploadImage.single("thumbnail"),
  updateBlog
);

router.route("/:id").delete(
  verifyJWT,
  verifyUserType(USER_TYPES.TRAINER),
  deleteBlog
);

export default router;
