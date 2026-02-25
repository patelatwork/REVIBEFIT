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

// Public routes
router.route("/").get(getAllBlogs);

// Protected routes - Fitness Enthusiast (must come before /:id routes)
router.route("/read-blogs").get(
  verifyJWT,
  verifyUserType(USER_TYPES.FITNESS_ENTHUSIAST),
  getUserReadBlogs
);

router.route("/:id").get(getBlogById);

router.route("/:id/mark-read").post(
  verifyJWT,
  verifyUserType(USER_TYPES.FITNESS_ENTHUSIAST),
  markBlogAsRead
);

router.route("/:id/read-status").get(
  verifyJWT,
  verifyUserType(USER_TYPES.FITNESS_ENTHUSIAST),
  getBlogReadStatus
);

// Protected routes - Trainer only
router.route("/").post(
  verifyJWT,
  verifyUserType(USER_TYPES.TRAINER),
  uploadImage.single("thumbnail"),
  createBlog
);

router.route("/trainer/my-blogs").get(
  verifyJWT,
  verifyUserType(USER_TYPES.TRAINER),
  getTrainerBlogs
);

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
