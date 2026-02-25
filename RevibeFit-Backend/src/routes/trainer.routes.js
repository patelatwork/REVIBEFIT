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

// Public routes
router.route("/").get(getAllApprovedTrainers);
router.route("/:id").get(getTrainerById);

// Private routes (Trainer only)
router.route("/dashboard/stats").get(verifyJWT, getTrainerDashboardStats);
router.route("/dashboard/clients").get(verifyJWT, getTrainerClients);
router.route("/dashboard/schedule").get(verifyJWT, getTrainerSchedule);
router.route("/dashboard/earnings").get(verifyJWT, getTrainerEarnings);
router.route("/profile").put(verifyJWT, updateTrainerProfile);

export default router;
