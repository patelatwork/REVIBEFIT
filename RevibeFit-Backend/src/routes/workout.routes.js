import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  saveCompletedWorkout,
  getCompletedWorkouts,
  deleteCompletedWorkout,
} from "../controllers/workout.controller.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Workout completion routes
router.post("/complete", saveCompletedWorkout);
router.get("/completed", getCompletedWorkouts);
router.delete("/completed/:id", deleteCompletedWorkout);

export default router;
