import express from "express";
import {
  createOrUpdateNutritionProfile,
  getNutritionProfile,
  deleteNutritionProfile,
  generateMealPlan,
  getMealPlans,
  getMealPlan,
  updateMealPlan,
  deleteMealPlan,
} from "../controllers/nutrition.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// ============ NUTRITION PROFILE ROUTES ============
router.post("/profile", createOrUpdateNutritionProfile);
router.get("/profile", getNutritionProfile);
router.delete("/profile", deleteNutritionProfile);

// ============ MEAL PLAN ROUTES ============
router.post("/meal-plan/generate", generateMealPlan);
router.get("/meal-plans", getMealPlans);
router.get("/meal-plans/:id", getMealPlan);
router.put("/meal-plans/:id", updateMealPlan);
router.delete("/meal-plans/:id", deleteMealPlan);

export default router;
