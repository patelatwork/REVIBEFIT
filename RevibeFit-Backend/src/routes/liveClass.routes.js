import { Router } from "express";
import {
  createLiveClass,
  getAllLiveClasses,
  getTrainerClasses,
  updateLiveClass,
  deleteLiveClass,
  joinLiveClass,
  getUserBookings,
  cancelBooking,
  getLiveClassById,
  getTrainerEarnings,
} from "../controllers/liveClass.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// ─── Public routes ────────────────────────────────────────

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: List all upcoming live classes
 *     tags: [Live Classes]
 *     responses:
 *       200:
 *         description: List of live classes
 */
router.route("/").get(getAllLiveClasses);

/**
 * @swagger
 * /api/classes/public/{id}:
 *   get:
 *     summary: Get live class details (public)
 *     tags: [Live Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Live class details
 *       404:
 *         description: Class not found
 */
router.route("/public/:id").get(getLiveClassById);

// ─── Protected routes ─────────────────────────────────────
router.use(verifyJWT);

// ─── Trainer — class management ──────────────────────────

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Create a live class (trainer)
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LiveClass'
 *     responses:
 *       201:
 *         description: Class created
 */
router.route("/").post(createLiveClass);

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: Update a live class (trainer)
 *     tags: [Live Classes]
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
 *         description: Class updated
 *   delete:
 *     summary: Delete a live class (trainer)
 *     tags: [Live Classes]
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
 *         description: Class deleted
 */
router.route("/:id").put(updateLiveClass).delete(deleteLiveClass);

/**
 * @swagger
 * /api/classes/trainer/my-classes:
 *   get:
 *     summary: Get trainer's own classes
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trainer's classes
 */
router.route("/trainer/my-classes").get(getTrainerClasses);

/**
 * @swagger
 * /api/classes/trainer/earnings:
 *   get:
 *     summary: Get trainer's live class earnings
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings data
 */
router.route("/trainer/earnings").get(getTrainerEarnings);

// ─── Fitness Enthusiast — class bookings ─────────────────

/**
 * @swagger
 * /api/classes/{id}/join:
 *   post:
 *     summary: Join/book a live class
 *     tags: [Live Classes]
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
 *         description: Successfully joined class
 */
router.route("/:id/join").post(joinLiveClass);

/**
 * @swagger
 * /api/classes/my-bookings:
 *   get:
 *     summary: Get user's class bookings
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.route("/my-bookings").get(getUserBookings);

/**
 * @swagger
 * /api/classes/bookings/{bookingId}:
 *   delete:
 *     summary: Cancel a class booking
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled
 */
router.route("/bookings/:bookingId").delete(cancelBooking);

export default router;
