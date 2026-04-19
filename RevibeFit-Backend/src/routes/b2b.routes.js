import { Router } from "express";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { USER_TYPES } from "../constants.js";
import config from "../config/index.js";

const router = Router();

function validateApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || !config.b2bApiKey || key !== config.b2bApiKey) {
    throw new ApiError(401, "Invalid or missing API key");
  }
  next();
}

/**
 * @swagger
 * /api/b2b/trainers:
 *   get:
 *     tags: [B2B - External]
 *     summary: Get approved trainers list (B2B)
 *     description: |
 *       **Consumer:** B2B (partner apps, gyms, corporate wellness platforms)
 *
 *       Returns a filtered list of verified trainers. Requires API key authentication.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by Indian state
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *         description: Filter by specialization (partial match)
 *     responses:
 *       200:
 *         description: List of approved trainers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Invalid or missing API key
 */
router.get(
  "/trainers",
  validateApiKey,
  asyncHandler(async (req, res) => {
    const { state, specialization } = req.query;

    const filter = {
      userType: USER_TYPES.TRAINER,
      isApproved: true,
      approvalStatus: "approved",
      isActive: true,
    };
    if (state) filter.state = state;
    if (specialization) filter.specialization = new RegExp(specialization, "i");

    const trainers = await User.find(filter)
      .select("name specialization state bio profilePhoto isVerified")
      .lean();

    return res.status(200).json(
      new ApiResponse(200, trainers, "Trainers retrieved successfully")
    );
  })
);

/**
 * @swagger
 * /api/b2b/lab-partners:
 *   get:
 *     tags: [B2B - External]
 *     summary: Get approved lab partners list (B2B)
 *     description: |
 *       **Consumer:** B2B (hospital networks, health insurance partners)
 *
 *       Returns a filtered list of verified lab partners. Requires API key authentication.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by Indian state
 *     responses:
 *       200:
 *         description: List of approved lab partners
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Invalid or missing API key
 */
router.get(
  "/lab-partners",
  validateApiKey,
  asyncHandler(async (req, res) => {
    const { state } = req.query;

    const filter = {
      userType: USER_TYPES.LAB_PARTNER,
      isApproved: true,
      approvalStatus: "approved",
      isActive: true,
      isSuspended: false,
    };
    if (state) filter.state = state;

    const labPartners = await User.find(filter)
      .select("name laboratoryName laboratoryAddress state profilePhoto")
      .lean();

    return res.status(200).json(
      new ApiResponse(200, labPartners, "Lab partners retrieved successfully")
    );
  })
);

export default router;
