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

/**
 * @swagger
 * /api/workouts/complete:
 *   post:
 *     summary: Save a completed workout
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompletedWorkout'
 *     responses:
 *       201:
 *         description: Workout saved
 */
router.post("/complete", saveCompletedWorkout);

/**
 * @swagger
 * /api/workouts/completed:
 *   get:
 *     summary: Get all completed workouts for the current user
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of completed workouts
 */
router.get("/completed", getCompletedWorkouts);

/**
 * @swagger
 * /api/workouts/completed/{id}:
 *   delete:
 *     summary: Delete a completed workout record
 *     tags: [Workouts]
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
 *         description: Workout record deleted
 */
router.delete("/completed/:id", deleteCompletedWorkout);

export default router;
