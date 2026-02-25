import { Router } from "express";
import {
  getAllApprovedTrainers,
  getTrainerById,
  getTrainerDashboardStats,
  getTrainerClients,
  getTrainerSchedule,
  getTrainerEarnings,
  updateTrainerProfile,
} from "../controllers/trainer.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// ─── Public routes ────────────────────────────────────────

/**
 * @swagger
 * /api/trainers:
 *   get:
 *     summary: List all approved trainers
 *     tags: [Trainers]
 *     responses:
 *       200:
 *         description: List of trainers
 */
router.route("/").get(getAllApprovedTrainers);

/**
 * @swagger
 * /api/trainers/{id}:
 *   get:
 *     summary: Get trainer details
 *     tags: [Trainers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trainer profile
 *       404:
 *         description: Trainer not found
 */
router.route("/:id").get(getTrainerById);

// ─── Trainer dashboard (protected) ───────────────────────

/**
 * @swagger
 * /api/trainers/dashboard/stats:
 *   get:
 *     summary: Get trainer dashboard statistics
 *     tags: [Trainers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.route("/dashboard/stats").get(verifyJWT, getTrainerDashboardStats);

/**
 * @swagger
 * /api/trainers/dashboard/clients:
 *   get:
 *     summary: Get trainer's clients
 *     tags: [Trainers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients
 */
router.route("/dashboard/clients").get(verifyJWT, getTrainerClients);

/**
 * @swagger
 * /api/trainers/dashboard/schedule:
 *   get:
 *     summary: Get trainer's schedule
 *     tags: [Trainers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schedule data
 */
router.route("/dashboard/schedule").get(verifyJWT, getTrainerSchedule);

/**
 * @swagger
 * /api/trainers/dashboard/earnings:
 *   get:
 *     summary: Get trainer's earnings overview
 *     tags: [Trainers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings data
 */
router.route("/dashboard/earnings").get(verifyJWT, getTrainerEarnings);

/**
 * @swagger
 * /api/trainers/profile:
 *   put:
 *     summary: Update trainer profile
 *     tags: [Trainers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specializations:
 *                 type: array
 *                 items:
 *                   type: string
 *               experience:
 *                 type: number
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.route("/profile").put(verifyJWT, updateTrainerProfile);

export default router;
