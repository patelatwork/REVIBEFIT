import { Router } from "express";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search users (trainers & lab partners) using Atlas Search
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (fuzzy match on name)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [trainer, lab-partner]
 *         description: Filter by user type
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by Indian state
 *     responses:
 *       200:
 *         description: Search results
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q = "", type, state } = req.query;

    // Fall back to regex search if no query provided
    if (!q.trim()) {
      const filter = { approvalStatus: "approved", isActive: true };
      if (type) filter.userType = type;
      if (state) filter.state = state;

      const results = await User.find(filter)
        .select("name email userType specialization laboratoryName state profilePhoto")
        .limit(20)
        .lean();

      return res.status(200).json(
        new ApiResponse(200, results, "Search results retrieved successfully")
      );
    }

    // Atlas Search pipeline
    const pipeline = [
      {
        $search: {
          index: "default",
          compound: {
            must: [
              {
                autocomplete: {
                  query: q,
                  path: "name",
                  fuzzy: { maxEdits: 1 },
                },
              },
            ],
            filter: [
              ...(type ? [{ text: { query: type, path: "userType" } }] : []),
              ...(state ? [{ text: { query: state, path: "state" } }] : []),
            ],
          },
        },
      },
      {
        $match: {
          approvalStatus: "approved",
          isActive: true,
        },
      },
      { $limit: 20 },
      {
        $project: {
          name: 1,
          email: 1,
          userType: 1,
          specialization: 1,
          laboratoryName: 1,
          state: 1,
          profilePhoto: 1,
          score: { $meta: "searchScore" },
        },
      },
    ];

    const regexFallback = async (message = "Search results retrieved successfully") => {
      const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const filter = {
        approvalStatus: "approved",
        isActive: true,
        $or: [
          { name: { $regex: escapedQ, $options: "i" } },
          { specialization: { $regex: escapedQ, $options: "i" } },
          { laboratoryName: { $regex: escapedQ, $options: "i" } },
          { bio: { $regex: escapedQ, $options: "i" } },
        ],
      };
      if (type) filter.userType = type;
      if (state) filter.state = state;

      const results = await User.find(filter)
        .select("name email userType specialization laboratoryName state profilePhoto")
        .limit(20)
        .lean();
      return { results, message };
    };

    try {
      const results = await User.aggregate(pipeline);

      // Atlas Search returns empty when index doesn't exist yet — fall back to regex
      if (results.length === 0) {
        const { results: fallbackResults, message } = await regexFallback();
        return res.status(200).json(new ApiResponse(200, fallbackResults, message));
      }

      return res.status(200).json(
        new ApiResponse(200, results, "Search results retrieved successfully")
      );
    } catch (err) {
      if (err.message?.includes("$search") || err.code === 40324) {
        const { results: fallbackResults, message } = await regexFallback();
        return res.status(200).json(new ApiResponse(200, fallbackResults, message));
      }
      throw err;
    }
  })
);

export default router;
