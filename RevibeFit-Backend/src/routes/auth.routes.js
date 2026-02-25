import { Router } from "express";
import { signup, login, logout } from "../controllers/auth.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Signup route with file upload for trainers
router.post("/signup", upload.single("certifications"), signup);

// Login route
router.post("/login", login);

// Logout route 
router.post("/logout", logout);

export default router;
