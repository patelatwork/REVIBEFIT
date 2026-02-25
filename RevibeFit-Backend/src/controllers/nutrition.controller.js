import { NutritionProfile } from "../models/nutritionProfile.model.js";
import { MealPlan } from "../models/mealPlan.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI inside the function to ensure env vars are loaded
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============ NUTRITION PROFILE ENDPOINTS ============

// @desc    Create or update nutrition profile
// @route   POST /api/nutrition/profile
// @access  Private (Fitness Enthusiast)
export const createOrUpdateNutritionProfile = asyncHandler(async (req, res) => {
  const {
    age,
    gender,
    height,
    weight,
    fitnessGoal,
    targetWeight,
    activityLevel,
    dietaryPreference,
    allergies,
    foodDislikes,
    healthConditions,
    mealsPerDay,
    waterIntakeTarget,
  } = req.body;

  // Validation
  if (!age || !gender || !height || !weight || !fitnessGoal || !activityLevel || !dietaryPreference) {
    throw new ApiError(400, "All required fields must be provided");
  }

  // Check if profile exists
  let nutritionProfile = await NutritionProfile.findOne({ user: req.user._id });

  if (nutritionProfile) {
    // Update existing profile
    nutritionProfile.age = age;
    nutritionProfile.gender = gender;
    nutritionProfile.height = height;
    nutritionProfile.weight = weight;
    nutritionProfile.fitnessGoal = fitnessGoal;
    nutritionProfile.targetWeight = targetWeight;
    nutritionProfile.activityLevel = activityLevel;
    nutritionProfile.dietaryPreference = dietaryPreference;
    nutritionProfile.allergies = allergies || [];
    nutritionProfile.foodDislikes = foodDislikes || [];
    nutritionProfile.healthConditions = healthConditions || ["none"];
    nutritionProfile.mealsPerDay = mealsPerDay || 3;
    nutritionProfile.waterIntakeTarget = waterIntakeTarget || 2.5;

    await nutritionProfile.save();

    return res.status(200).json(
      new ApiResponse(200, nutritionProfile, "Nutrition profile updated successfully")
    );
  } else {
    // Create new profile
    nutritionProfile = await NutritionProfile.create({
      user: req.user._id,
      age,
      gender,
      height,
      weight,
      fitnessGoal,
      targetWeight,
      activityLevel,
      dietaryPreference,
      allergies: allergies || [],
      foodDislikes: foodDislikes || [],
      healthConditions: healthConditions || ["none"],
      mealsPerDay: mealsPerDay || 3,
      waterIntakeTarget: waterIntakeTarget || 2.5,
    });

    return res.status(201).json(
      new ApiResponse(201, nutritionProfile, "Nutrition profile created successfully")
    );
  }
});

// @desc    Get user's nutrition profile
// @route   GET /api/nutrition/profile
// @access  Private (Fitness Enthusiast)
export const getNutritionProfile = asyncHandler(async (req, res) => {
  const nutritionProfile = await NutritionProfile.findOne({ user: req.user._id });

  if (!nutritionProfile) {
    throw new ApiError(404, "Nutrition profile not found. Please create one first.");
  }

  res.status(200).json(
    new ApiResponse(200, nutritionProfile, "Nutrition profile retrieved successfully")
  );
});

// @desc    Delete nutrition profile
// @route   DELETE /api/nutrition/profile
// @access  Private (Fitness Enthusiast)
export const deleteNutritionProfile = asyncHandler(async (req, res) => {
  const nutritionProfile = await NutritionProfile.findOneAndDelete({ user: req.user._id });

  if (!nutritionProfile) {
    throw new ApiError(404, "Nutrition profile not found");
  }

  res.status(200).json(
    new ApiResponse(200, {}, "Nutrition profile deleted successfully")
  );
});

// ============ MEAL LOG ENDPOINTS ============

// @desc    Log a meal
// @route   POST /api/nutrition/meals/log
// @access  Private (Fitness Enthusiast)
export const logMeal = asyncHandler(async (req, res) => {
  const { date, mealType, foodItems, notes } = req.body;

  if (!date || !mealType || !foodItems || foodItems.length === 0) {
    throw new ApiError(400, "Date, meal type, and at least one food item are required");
  }

  const mealLog = await MealLog.create({
    user: req.user._id,
    date,
    mealType,
    foodItems,
    notes,
  });

  res.status(201).json(
    new ApiResponse(201, mealLog, "Meal logged successfully")
  );
});

// @desc    Get meal logs for a date range
// @route   GET /api/nutrition/meals/logs?startDate=&endDate=
// @access  Private (Fitness Enthusiast)
export const getMealLogs = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError(400, "Start date and end date are required");
  }

  const mealLogs = await MealLog.find({
    user: req.user._id,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  }).sort({ date: -1, createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, mealLogs, "Meal logs retrieved successfully")
  );
});

// @desc    Get today's meal logs
// @route   GET /api/nutrition/meals/today
// @access  Private (Fitness Enthusiast)
export const getTodayMealLogs = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const mealLogs = await MealLog.find({
    user: req.user._id,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  }).sort({ createdAt: 1 });

  // Calculate daily totals
  const dailyTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  };

  mealLogs.forEach((log) => {
    dailyTotals.calories += log.totalCalories;
    dailyTotals.protein += log.totalProtein;
    dailyTotals.carbs += log.totalCarbs;
    dailyTotals.fats += log.totalFats;
    dailyTotals.fiber += log.totalFiber;
    dailyTotals.sugar += log.totalSugar;
    dailyTotals.sodium += log.totalSodium;
  });

  res.status(200).json(
    new ApiResponse(200, { mealLogs, dailyTotals }, "Today's meal logs retrieved successfully")
  );
});

// @desc    Update meal log
// @route   PUT /api/nutrition/meals/log/:id
// @access  Private (Fitness Enthusiast)
export const updateMealLog = asyncHandler(async (req, res) => {
  const mealLog = await MealLog.findById(req.params.id);

  if (!mealLog) {
    throw new ApiError(404, "Meal log not found");
  }

  if (mealLog.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to update this meal log");
  }

  const { date, mealType, foodItems, notes } = req.body;

  if (date) mealLog.date = date;
  if (mealType) mealLog.mealType = mealType;
  if (foodItems) mealLog.foodItems = foodItems;
  if (notes !== undefined) mealLog.notes = notes;

  await mealLog.save();

  res.status(200).json(
    new ApiResponse(200, mealLog, "Meal log updated successfully")
  );
});

// @desc    Delete meal log
// @route   DELETE /api/nutrition/meals/log/:id
// @access  Private (Fitness Enthusiast)
export const deleteMealLog = asyncHandler(async (req, res) => {
  const mealLog = await MealLog.findById(req.params.id);

  if (!mealLog) {
    throw new ApiError(404, "Meal log not found");
  }

  if (mealLog.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to delete this meal log");
  }

  await mealLog.deleteOne();

  res.status(200).json(
    new ApiResponse(200, {}, "Meal log deleted successfully")
  );
});

// ============ FOOD DATABASE ENDPOINTS ============

// @desc    Search food from FatSecret API
// @route   GET /api/nutrition/food/search?query=chicken
// @access  Private (Fitness Enthusiast)
export const searchFood = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) {
    throw new ApiError(400, "Search query is required");
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new ApiError(500, "FatSecret API credentials not configured");
  }

  try {
    // Get OAuth2 access token
    const authResponse = await axios.post(
      'https://oauth.fatsecret.com/connect/token',
      'grant_type=client_credentials&scope=basic',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: clientId,
          password: clientSecret,
        },
      }
    );

    const accessToken = authResponse.data.access_token;

    // Search for foods
    const searchResponse = await axios.post(
      'https://platform.fatsecret.com/rest/server.api',
      null,
      {
        params: {
          method: 'foods.search',
          search_expression: query,
          format: 'json',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const foodsData = searchResponse.data.foods?.food || [];
    const foods = Array.isArray(foodsData) ? foodsData : [foodsData];

    const formattedFoods = foods.slice(0, 20).map((food) => ({
      foodId: food.food_id,
      label: food.food_name,
      brand: food.brand_name || 'Generic',
      description: food.food_description,
      type: food.food_type,
    }));

    res.status(200).json(
      new ApiResponse(200, formattedFoods, "Food items retrieved successfully")
    );
  } catch (error) {
    console.error("FatSecret API Error:", error.response?.data || error.message);
    throw new ApiError(500, "Failed to fetch food data from FatSecret");
  }
});

// @desc    Get detailed nutrition for food
// @route   POST /api/nutrition/food/analyze
// @access  Private (Fitness Enthusiast)
export const analyzeFood = asyncHandler(async (req, res) => {
  const { foodId, servingId } = req.body; // FatSecret food_id and serving_id

  if (!foodId) {
    throw new ApiError(400, "Food ID is required");
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new ApiError(500, "FatSecret API credentials not configured");
  }

  try {
    // Get OAuth2 access token
    const authResponse = await axios.post(
      'https://oauth.fatsecret.com/connect/token',
      'grant_type=client_credentials&scope=basic',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: clientId,
          password: clientSecret,
        },
      }
    );

    const accessToken = authResponse.data.access_token;

    // Get food details
    const foodResponse = await axios.post(
      'https://platform.fatsecret.com/rest/server.api',
      null,
      {
        params: {
          method: 'food.get.v2',
          food_id: foodId,
          format: 'json',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const food = foodResponse.data.food;
    const servings = food.servings?.serving || [];
    const servingArray = Array.isArray(servings) ? servings : [servings];

    // Get the specified serving or default to first one
    const serving = servingId
      ? servingArray.find(s => s.serving_id === servingId) || servingArray[0]
      : servingArray[0];

    const nutritionData = {
      foodName: food.food_name,
      brandName: food.brand_name,
      serving: {
        servingId: serving.serving_id,
        servingDescription: serving.serving_description,
        metricServingAmount: serving.metric_serving_amount,
        metricServingUnit: serving.metric_serving_unit,
      },
      nutrients: {
        calories: parseFloat(serving.calories) || 0,
        protein: parseFloat(serving.protein) || 0,
        carbs: parseFloat(serving.carbohydrate) || 0,
        fats: parseFloat(serving.fat) || 0,
        fiber: parseFloat(serving.fiber) || 0,
        sugar: parseFloat(serving.sugar) || 0,
        sodium: parseFloat(serving.sodium) || 0,
        saturatedFat: parseFloat(serving.saturated_fat) || 0,
        cholesterol: parseFloat(serving.cholesterol) || 0,
      },
      allServings: servingArray.map(s => ({
        servingId: s.serving_id,
        description: s.serving_description,
        calories: parseFloat(s.calories) || 0,
      })),
    };

    res.status(200).json(
      new ApiResponse(200, nutritionData, "Nutrition analysis completed successfully")
    );
  } catch (error) {
    console.error("FatSecret API Error:", error.response?.data || error.message);
    throw new ApiError(500, "Failed to analyze nutrition data");
  }
});

// ============ MEAL PLAN ENDPOINTS ============

// @desc    Generate meal plan
// @route   POST /api/nutrition/meal-plan/generate
// @access  Private (Fitness Enthusiast)
export const generateMealPlan = asyncHandler(async (req, res) => {
  const { planType, startDate, customPrompt } = req.body; // planType: "daily" or "weekly"

  if (!planType || !startDate) {
    throw new ApiError(400, "Plan type and start date are required");
  }

  // Check if Gemini API key exists
  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(500, "Gemini API key not configured. Please add GEMINI_API_KEY to your .env file");
  }

  // Get user's nutrition profile
  const nutritionProfile = await NutritionProfile.findOne({ user: req.user._id });

  if (!nutritionProfile) {
    throw new ApiError(404, "Nutrition profile not found. Please create one first.");
  }

  // Prepare prompt for meal plan generation
  const days = planType === "weekly" ? 7 : 1;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days - 1);

  const aiPrompt = `
You are a professional nutritionist. Generate a detailed ${planType} meal plan with the following requirements:

User Profile:
- Age: ${nutritionProfile.age}, Gender: ${nutritionProfile.gender}
- Height: ${nutritionProfile.height}cm, Weight: ${nutritionProfile.weight}kg
- BMI: ${nutritionProfile.bmi}
- Fitness Goal: ${nutritionProfile.fitnessGoal}
- Activity Level: ${nutritionProfile.activityLevel}
- Dietary Preference: ${nutritionProfile.dietaryPreference}
- Allergies: ${nutritionProfile.allergies.join(", ") || "None"}
- Food Dislikes: ${nutritionProfile.foodDislikes.join(", ") || "None"}
- Health Conditions: ${nutritionProfile.healthConditions.join(", ")}

Daily Nutritional Targets:
- Calories: ${nutritionProfile.dailyCalorieTarget} kcal
- Protein: ${nutritionProfile.dailyProteinTarget}g
- Carbs: ${nutritionProfile.dailyCarbsTarget}g
- Fats: ${nutritionProfile.dailyFatsTarget}g

${customPrompt ? `Additional Requirements: ${customPrompt}` : ""}

Please generate a ${days}-day meal plan in JSON format with this exact structure:
{
  "meals": [
    {
      "dayOfWeek": "monday",
      "date": "2024-01-01",
      "breakfast": {
        "name": "Meal Name",
        "description": "Brief description",
        "items": [{"name": "Food item", "quantity": 100, "unit": "g"}],
        "calories": 400,
        "protein": 20,
        "carbs": 50,
        "fats": 15,
        "prepTime": 15,
        "instructions": "Step by step cooking instructions"
      },
      "lunch": { /* same structure */ },
      "dinner": { /* same structure */ },
      "snacks": [{ /* similar structure with time field */ }]
    }
  ]
}

Important: Return ONLY valid JSON, no additional text. Ensure meals meet the dietary preferences and avoid allergies.
`;

  try {
    // Call Gemini API for meal plan generation
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    const text = response.text();

    console.log("Response received:", text.substring(0, 200)); // Log first 200 chars

    // Parse response
    let mealPlanData;
    try {
      // Clean the text: remove markdown code blocks and extra whitespace
      let cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Try to find the first { and last } to extract pure JSON
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
        mealPlanData = JSON.parse(cleanedText);
        
        // Validate the structure
        if (!mealPlanData.meals || !Array.isArray(mealPlanData.meals)) {
          throw new Error("Invalid meal plan structure: missing meals array");
        }
      } else {
        throw new Error("No valid JSON structure found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse response:", parseError.message);
      console.error("Raw response:", text.substring(0, 500));
      throw new ApiError(500, `Failed to parse generated meal plan: ${parseError.message}`);
    }

    // Create meal plan in database
    const mealPlan = await MealPlan.create({
      user: req.user._id,
      planName: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan - ${new Date(startDate).toLocaleDateString()}`,
      planType,
      startDate,
      endDate,
      meals: mealPlanData.meals,
      generatedBy: "auto",
      aiPrompt,
      targetCalories: nutritionProfile.dailyCalorieTarget,
      targetProtein: nutritionProfile.dailyProteinTarget,
      targetCarbs: nutritionProfile.dailyCarbsTarget,
      targetFats: nutritionProfile.dailyFatsTarget,
      dietaryPreference: nutritionProfile.dietaryPreference,
      allergies: nutritionProfile.allergies,
    });

    res.status(201).json(
      new ApiResponse(201, mealPlan, "Meal plan generated successfully")
    );
  } catch (error) {
    console.error("Meal Plan Generation Error:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    // Return more specific error message
    const errorMessage = error.message || "Failed to generate meal plan";
    throw new ApiError(500, errorMessage);
  }
});

// @desc    Get user's meal plans
// @route   GET /api/nutrition/meal-plans
// @access  Private (Fitness Enthusiast)
export const getMealPlans = asyncHandler(async (req, res) => {
  const { active } = req.query; // Filter by active status

  const filter = { user: req.user._id };
  if (active !== undefined) {
    filter.isActive = active === "true";
  }

  const mealPlans = await MealPlan.find(filter).sort({ startDate: -1 });

  res.status(200).json(
    new ApiResponse(200, mealPlans, "Meal plans retrieved successfully")
  );
});

// @desc    Get specific meal plan
// @route   GET /api/nutrition/meal-plans/:id
// @access  Private (Fitness Enthusiast)
export const getMealPlan = asyncHandler(async (req, res) => {
  const mealPlan = await MealPlan.findById(req.params.id);

  if (!mealPlan) {
    throw new ApiError(404, "Meal plan not found");
  }

  if (mealPlan.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to access this meal plan");
  }

  res.status(200).json(
    new ApiResponse(200, mealPlan, "Meal plan retrieved successfully")
  );
});

// @desc    Update meal plan (mark as active/inactive, add rating/feedback)
// @route   PUT /api/nutrition/meal-plans/:id
// @access  Private (Fitness Enthusiast)
export const updateMealPlan = asyncHandler(async (req, res) => {
  const mealPlan = await MealPlan.findById(req.params.id);

  if (!mealPlan) {
    throw new ApiError(404, "Meal plan not found");
  }

  if (mealPlan.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to update this meal plan");
  }

  const { isActive, rating, feedback } = req.body;

  if (isActive !== undefined) mealPlan.isActive = isActive;
  if (rating !== undefined) mealPlan.rating = rating;
  if (feedback !== undefined) mealPlan.feedback = feedback;

  await mealPlan.save();

  res.status(200).json(
    new ApiResponse(200, mealPlan, "Meal plan updated successfully")
  );
});

// @desc    Delete meal plan
// @route   DELETE /api/nutrition/meal-plans/:id
// @access  Private (Fitness Enthusiast)
export const deleteMealPlan = asyncHandler(async (req, res) => {
  const mealPlan = await MealPlan.findById(req.params.id);

  if (!mealPlan) {
    throw new ApiError(404, "Meal plan not found");
  }

  if (mealPlan.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to delete this meal plan");
  }

  await mealPlan.deleteOne();

  res.status(200).json(
    new ApiResponse(200, {}, "Meal plan deleted successfully")
  );
});

// ============ ANALYTICS ENDPOINTS ============

// @desc    Get nutrition statistics
// @route   GET /api/nutrition/stats?period=week
// @access  Private (Fitness Enthusiast)
export const getNutritionStats = asyncHandler(async (req, res) => {
  const { period } = req.query; // "week", "month", or "year"

  let startDate = new Date();

  switch (period) {
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  const mealLogs = await MealLog.find({
    user: req.user._id,
    date: { $gte: startDate },
  }).sort({ date: 1 });

  // Calculate statistics
  const stats = {
    totalMeals: mealLogs.length,
    averageCalories: 0,
    averageProtein: 0,
    averageCarbs: 0,
    averageFats: 0,
    dailyBreakdown: [],
  };

  if (mealLogs.length > 0) {
    const totalCalories = mealLogs.reduce((sum, log) => sum + log.totalCalories, 0);
    const totalProtein = mealLogs.reduce((sum, log) => sum + log.totalProtein, 0);
    const totalCarbs = mealLogs.reduce((sum, log) => sum + log.totalCarbs, 0);
    const totalFats = mealLogs.reduce((sum, log) => sum + log.totalFats, 0);

    stats.averageCalories = Math.round(totalCalories / mealLogs.length);
    stats.averageProtein = Math.round(totalProtein / mealLogs.length);
    stats.averageCarbs = Math.round(totalCarbs / mealLogs.length);
    stats.averageFats = Math.round(totalFats / mealLogs.length);

    // Group by date
    const dailyMap = new Map();
    mealLogs.forEach((log) => {
      const dateKey = log.date.toISOString().split("T")[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          meals: 0,
        });
      }
      const day = dailyMap.get(dateKey);
      day.calories += log.totalCalories;
      day.protein += log.totalProtein;
      day.carbs += log.totalCarbs;
      day.fats += log.totalFats;
      day.meals += 1;
    });

    stats.dailyBreakdown = Array.from(dailyMap.values());
  }

  res.status(200).json(
    new ApiResponse(200, stats, "Nutrition statistics retrieved successfully")
  );
});
