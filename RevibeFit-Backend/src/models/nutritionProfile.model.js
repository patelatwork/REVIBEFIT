import mongoose from "mongoose";

const nutritionProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Basic Information
    age: {
      type: Number,
      required: true,
      min: [13, "Age must be at least 13"],
      max: [100, "Age must be less than 100"],
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
    },
    height: {
      type: Number, // in cm
      required: true,
      min: [100, "Height must be at least 100 cm"],
      max: [250, "Height must be less than 250 cm"],
    },
    weight: {
      type: Number, // in kg
      required: true,
      min: [30, "Weight must be at least 30 kg"],
      max: [300, "Weight must be less than 300 kg"],
    },
    // Fitness Goals
    fitnessGoal: {
      type: String,
      required: true,
      enum: [
        "weight-loss",
        "muscle-gain",
        "maintenance",
        "endurance",
        "general-health",
      ],
    },
    targetWeight: {
      type: Number, // in kg
      min: [30, "Target weight must be at least 30 kg"],
      max: [300, "Target weight must be less than 300 kg"],
    },
    // Activity Level
    activityLevel: {
      type: String,
      required: true,
      enum: ["sedentary", "lightly-active", "moderately-active", "very-active", "extremely-active"],
    },
    // Dietary Preferences
    dietaryPreference: {
      type: String,
      required: true,
      enum: [
        "none",
        "vegetarian",
        "vegan",
        "keto",
        "paleo",
        "mediterranean",
        "low-carb",
        "low-fat",
        "gluten-free",
        "dairy-free",
      ],
    },
    // Allergies and Restrictions
    allergies: {
      type: [String],
      default: [],
    },
    foodDislikes: {
      type: [String],
      default: [],
    },
    // Health Conditions
    healthConditions: {
      type: [String],
      enum: [
        "diabetes",
        "hypertension",
        "heart-disease",
        "thyroid",
        "pcos",
        "kidney-disease",
        "none",
      ],
      default: ["none"],
    },
    // Calculated Metrics
    bmi: {
      type: Number,
    },
    bmr: {
      type: Number, // Basal Metabolic Rate
    },
    tdee: {
      type: Number, // Total Daily Energy Expenditure
    },
    // Daily Nutritional Targets
    dailyCalorieTarget: {
      type: Number,
      required: true,
    },
    dailyProteinTarget: {
      type: Number, // in grams
      required: true,
    },
    dailyCarbsTarget: {
      type: Number, // in grams
      required: true,
    },
    dailyFatsTarget: {
      type: Number, // in grams
      required: true,
    },
    // Meal Preferences
    mealsPerDay: {
      type: Number,
      default: 3,
      min: 2,
      max: 6,
    },
    // Additional Info
    waterIntakeTarget: {
      type: Number, // in liters
      default: 2.5,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate all metrics before saving
nutritionProfileSchema.pre("validate", function (next) {
  // 1. Calculate BMI
  if (this.height && this.weight) {
    const heightInMeters = this.height / 100;
    this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(2));
  }

  // 2. Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
  if (this.weight && this.height && this.age && this.gender) {
    let bmr;
    if (this.gender === "male") {
      bmr = 10 * this.weight + 6.25 * this.height - 5 * this.age + 5;
    } else {
      bmr = 10 * this.weight + 6.25 * this.height - 5 * this.age - 161;
    }
    this.bmr = Math.round(bmr);
  }

  // 3. Calculate TDEE (Total Daily Energy Expenditure)
  if (this.bmr && this.activityLevel) {
    const activityMultipliers = {
      sedentary: 1.2,
      "lightly-active": 1.375,
      "moderately-active": 1.55,
      "very-active": 1.725,
      "extremely-active": 1.9,
    };
    this.tdee = Math.round(this.bmr * activityMultipliers[this.activityLevel]);
  }

  // 4. Calculate daily targets based on goals
  if (this.tdee && this.fitnessGoal) {
    let calorieTarget;

    // Adjust calories based on fitness goal
    switch (this.fitnessGoal) {
      case "weight-loss":
        calorieTarget = this.tdee - 500; // 500 calorie deficit
        break;
      case "muscle-gain":
        calorieTarget = this.tdee + 300; // 300 calorie surplus
        break;
      case "maintenance":
      case "endurance":
      case "general-health":
        calorieTarget = this.tdee;
        break;
      default:
        calorieTarget = this.tdee;
    }

    this.dailyCalorieTarget = Math.round(calorieTarget);

    // Calculate macros based on goal and dietary preference
    let proteinPercentage, carbsPercentage, fatsPercentage;

    if (this.dietaryPreference === "keto") {
      proteinPercentage = 0.25;
      carbsPercentage = 0.05;
      fatsPercentage = 0.70;
    } else if (this.dietaryPreference === "low-carb") {
      proteinPercentage = 0.30;
      carbsPercentage = 0.20;
      fatsPercentage = 0.50;
    } else if (this.dietaryPreference === "low-fat") {
      proteinPercentage = 0.30;
      carbsPercentage = 0.55;
      fatsPercentage = 0.15;
    } else {
      // Balanced macro split
      if (this.fitnessGoal === "muscle-gain") {
        proteinPercentage = 0.30;
        carbsPercentage = 0.45;
        fatsPercentage = 0.25;
      } else if (this.fitnessGoal === "weight-loss") {
        proteinPercentage = 0.35;
        carbsPercentage = 0.35;
        fatsPercentage = 0.30;
      } else {
        proteinPercentage = 0.25;
        carbsPercentage = 0.50;
        fatsPercentage = 0.25;
      }
    }

    // Calculate macros in grams
    this.dailyProteinTarget = Math.round((this.dailyCalorieTarget * proteinPercentage) / 4);
    this.dailyCarbsTarget = Math.round((this.dailyCalorieTarget * carbsPercentage) / 4);
    this.dailyFatsTarget = Math.round((this.dailyCalorieTarget * fatsPercentage) / 9);
  }

  next();
});

export const NutritionProfile = mongoose.model("NutritionProfile", nutritionProfileSchema);
