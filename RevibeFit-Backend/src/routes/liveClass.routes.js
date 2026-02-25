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

// Public routes (no authentication required)
router.route("/").get(getAllLiveClasses);
router.route("/public/:id").get(getLiveClassById); // Make it more specific

// Protected routes - require authentication
router.use(verifyJWT);

// Class management routes (for trainers)
router.route("/").post(createLiveClass);
router.route("/:id").put(updateLiveClass).delete(deleteLiveClass);

// Trainer-specific routes
router.route("/trainer/my-classes").get(getTrainerClasses);
router.route("/trainer/earnings").get(getTrainerEarnings);

// Class joining routes (for fitness enthusiasts)
router.route("/:id/join").post(joinLiveClass);
router.route("/my-bookings").get(getUserBookings);
router.route("/bookings/:bookingId").delete(cancelBooking);

export default router;