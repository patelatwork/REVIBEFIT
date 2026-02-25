import mongoose from "mongoose";

const mealPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    planType: {
      type: String,
      required: true,
      enum: ["daily", "weekly"],
      default: "weekly",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Weekly plan structure
    meals: [
      {
        dayOfWeek: {
          type: String,
          enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        },
        date: {
          type: Date,
        },
        breakfast: {
          name: String,
          description: String,
          items: [
            {
              name: String,
              quantity: Number,
              unit: String,
            },
          ],
          calories: Number,
          protein: Number,
          carbs: Number,
          fats: Number,
          prepTime: Number, // in minutes
          instructions: String,
        },
        lunch: {
          name: String,
          description: String,
          items: [
            {
              name: String,
              quantity: Number,
              unit: String,
            },
          ],
          calories: Number,
          protein: Number,
          carbs: Number,
          fats: Number,
          prepTime: Number,
          instructions: String,
        },
        dinner: {
          name: String,
          description: String,
          items: [
            {
              name: String,
              quantity: Number,
              unit: String,
            },
          ],
          calories: Number,
          protein: Number,
          carbs: Number,
          fats: Number,
          prepTime: Number,
          instructions: String,
        },
        snacks: [
          {
            name: String,
            description: String,
            items: [
              {
                name: String,
                quantity: Number,
                unit: String,
              },
            ],
            calories: Number,
            protein: Number,
            carbs: Number,
            fats: Number,
            time: String, // e.g., "mid-morning", "evening"
          },
        ],
        totalDailyCalories: Number,
        totalDailyProtein: Number,
        totalDailyCarbs: Number,
        totalDailyFats: Number,
      },
    ],
    // Generation metadata
    generatedBy: {
      type: String,
      enum: ["user", "auto"],
      default: "auto",
    },
    aiPrompt: {
      type: String,
    },
    generationDate: {
      type: Date,
      default: Date.now,
    },
    // Nutrition Profile snapshot at generation time
    targetCalories: {
      type: Number,
      required: true,
    },
    targetProtein: {
      type: Number,
      required: true,
    },
    targetCarbs: {
      type: Number,
      required: true,
    },
    targetFats: {
      type: Number,
      required: true,
    },
    dietaryPreference: {
      type: String,
    },
    allergies: [String],
    // User feedback
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate daily totals before saving
mealPlanSchema.pre("save", function (next) {
  if (this.meals && this.meals.length > 0) {
    this.meals.forEach((day) => {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFats = 0;

      if (day.breakfast) {
        totalCalories += day.breakfast.calories || 0;
        totalProtein += day.breakfast.protein || 0;
        totalCarbs += day.breakfast.carbs || 0;
        totalFats += day.breakfast.fats || 0;
      }

      if (day.lunch) {
        totalCalories += day.lunch.calories || 0;
        totalProtein += day.lunch.protein || 0;
        totalCarbs += day.lunch.carbs || 0;
        totalFats += day.lunch.fats || 0;
      }

      if (day.dinner) {
        totalCalories += day.dinner.calories || 0;
        totalProtein += day.dinner.protein || 0;
        totalCarbs += day.dinner.carbs || 0;
        totalFats += day.dinner.fats || 0;
      }

      if (day.snacks && day.snacks.length > 0) {
        day.snacks.forEach((snack) => {
          totalCalories += snack.calories || 0;
          totalProtein += snack.protein || 0;
          totalCarbs += snack.carbs || 0;
          totalFats += snack.fats || 0;
        });
      }

      day.totalDailyCalories = Math.round(totalCalories);
      day.totalDailyProtein = Math.round(totalProtein);
      day.totalDailyCarbs = Math.round(totalCarbs);
      day.totalDailyFats = Math.round(totalFats);
    });
  }
  next();
});

// Index for efficient queries
mealPlanSchema.index({ user: 1, isActive: 1, startDate: -1 });
mealPlanSchema.index({ user: 1, endDate: 1 });

export const MealPlan = mongoose.model("MealPlan", mealPlanSchema);
