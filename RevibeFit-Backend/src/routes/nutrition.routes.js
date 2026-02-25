import express from "express";
import {
  createOrUpdateNutritionProfile,
  getNutritionProfile,
  deleteNutritionProfile,
  logMeal,
  getMealLogs,
  getTodayMealLogs,
  updateMealLog,
  deleteMealLog,
  searchFood,
  analyzeFood,
  generateMealPlan,
  getMealPlans,
  getMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getNutritionStats,
} from "../controllers/nutrition.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// ─── Nutrition Profile ────────────────────────────────────

/**
 * @swagger
 * /api/nutrition/profile:
 *   post:
 *     summary: Create or update nutrition profile
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NutritionProfile'
 *     responses:
 *       200:
 *         description: Profile saved
 *   get:
 *     summary: Get current user's nutrition profile
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nutrition profile
 *       404:
 *         description: Profile not found
 *   delete:
 *     summary: Delete nutrition profile
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted
 */
router.post("/profile", createOrUpdateNutritionProfile);
router.get("/profile", getNutritionProfile);
router.delete("/profile", deleteNutritionProfile);

// ─── Meal Logging ─────────────────────────────────────────

/**
 * @swagger
 * /api/nutrition/meals/log:
 *   post:
 *     summary: Log a meal
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, mealType, foodItems]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               mealType:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack]
 *               foodItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     calories:
 *                       type: number
 *                     protein:
 *                       type: number
 *                     carbs:
 *                       type: number
 *                     fats:
 *                       type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Meal logged
 */
router.post("/meals/log", logMeal);

/**
 * @swagger
 * /api/nutrition/meals/today:
 *   get:
 *     summary: Get today's meal logs with daily totals
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's meals and totals
 */
router.get("/meals/today", getTodayMealLogs);

/**
 * @swagger
 * /api/nutrition/meals/logs:
 *   get:
 *     summary: Get meal logs for a date range
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Meal logs
 */
router.get("/meals/logs", getMealLogs);

/**
 * @swagger
 * /api/nutrition/meals/log/{id}:
 *   put:
 *     summary: Update a meal log
 *     tags: [Nutrition]
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
 *         description: Meal log updated
 *   delete:
 *     summary: Delete a meal log
 *     tags: [Nutrition]
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
 *         description: Meal log deleted
 */
router.put("/meals/log/:id", updateMealLog);
router.delete("/meals/log/:id", deleteMealLog);

// ─── Food Search (FatSecret) ──────────────────────────────

/**
 * @swagger
 * /api/nutrition/food/search:
 *   get:
 *     summary: Search foods via FatSecret API
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Food name to search for
 *     responses:
 *       200:
 *         description: List of matching foods
 */
router.get("/food/search", searchFood);

/**
 * @swagger
 * /api/nutrition/food/analyze:
 *   post:
 *     summary: Get detailed nutrition for a food item
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [foodId]
 *             properties:
 *               foodId:
 *                 type: string
 *               servingId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Detailed nutrition data
 */
router.post("/food/analyze", analyzeFood);

// ─── Nutrition Stats ──────────────────────────────────────

/**
 * @swagger
 * /api/nutrition/stats:
 *   get:
 *     summary: Get nutrition statistics (week/month/year)
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: week
 *     responses:
 *       200:
 *         description: Nutrition statistics
 */
router.get("/stats", getNutritionStats);

// ─── Meal Plans ───────────────────────────────────────────

/**
 * @swagger
 * /api/nutrition/meal-plan/generate:
 *   post:
 *     summary: Generate an AI-powered meal plan
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     description: Uses Gemini AI and FatSecret API to generate a personalized meal plan based on the user's nutrition profile.
 *     responses:
 *       201:
 *         description: Meal plan generated
 */
router.post("/meal-plan/generate", generateMealPlan);

/**
 * @swagger
 * /api/nutrition/meal-plans:
 *   get:
 *     summary: Get all meal plans for the current user
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of meal plans
 */
router.get("/meal-plans", getMealPlans);

/**
 * @swagger
 * /api/nutrition/meal-plans/{id}:
 *   get:
 *     summary: Get a specific meal plan
 *     tags: [Nutrition]
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
 *         description: Meal plan details
 *   put:
 *     summary: Update a meal plan
 *     tags: [Nutrition]
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
 *         description: Meal plan updated
 *   delete:
 *     summary: Delete a meal plan
 *     tags: [Nutrition]
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
 *         description: Meal plan deleted
 */
router.get("/meal-plans/:id", getMealPlan);
router.put("/meal-plans/:id", updateMealPlan);
router.delete("/meal-plans/:id", deleteMealPlan);

export default router;
