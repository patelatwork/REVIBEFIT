import { Router } from "express";
import { verifyJWT, verifyUserType, verifyAdmin } from "../middlewares/auth.middleware.js";
import { USER_TYPES } from "../constants.js";
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  requestRefund,
  adminOverrideRefund,
} from "../controllers/payment.controller.js";

const router = Router();

// Fitness enthusiast payment routes
router.post(
  "/create-order",
  verifyJWT,
  verifyUserType(USER_TYPES.FITNESS_ENTHUSIAST),
  createPaymentOrder
);

router.post(
  "/verify",
  verifyJWT,
  verifyUserType(USER_TYPES.FITNESS_ENTHUSIAST),
  verifyPayment
);

// Payment status (any authenticated user)
router.get(
  "/:bookingId/status",
  verifyJWT,
  getPaymentStatus
);

// Refund routes
router.post(
  "/:bookingId/refund",
  verifyJWT,
  verifyUserType(USER_TYPES.FITNESS_ENTHUSIAST),
  requestRefund
);

router.post(
  "/:bookingId/admin-refund",
  verifyAdmin,
  adminOverrideRefund
);

export default router;
