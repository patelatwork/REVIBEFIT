import mongoose, { Schema } from "mongoose";

const foodItemSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    unit: {
      type: String,
      default: "serving",
      trim: true,
    },
    calories: {
      type: Number,
      default: 0,
    },
    protein: {
      type: Number,
      default: 0,
    },
    carbs: {
      type: Number,
      default: 0,
    },
    fats: {
      type: Number,
      default: 0,
    },
    fiber: {
      type: Number,
      default: 0,
    },
    sugar: {
      type: Number,
      default: 0,
    },
    sodium: {
      type: Number,
      default: 0,
    },
    // FatSecret reference IDs (optional)
    fatSecretFoodId: String,
    fatSecretServingId: String,
  },
  { _id: false }
);

const mealLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    mealType: {
      type: String,
      required: true,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      trim: true,
    },
    foodItems: {
      type: [foodItemSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one food item is required",
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual computed nutrition totals ────────────────────
mealLogSchema.virtual("totalCalories").get(function () {
  return this.foodItems.reduce((sum, item) => sum + (item.calories || 0), 0);
});

mealLogSchema.virtual("totalProtein").get(function () {
  return this.foodItems.reduce((sum, item) => sum + (item.protein || 0), 0);
});

mealLogSchema.virtual("totalCarbs").get(function () {
  return this.foodItems.reduce((sum, item) => sum + (item.carbs || 0), 0);
});

mealLogSchema.virtual("totalFats").get(function () {
  return this.foodItems.reduce((sum, item) => sum + (item.fats || 0), 0);
});

mealLogSchema.virtual("totalFiber").get(function () {
  return this.foodItems.reduce((sum, item) => sum + (item.fiber || 0), 0);
});

mealLogSchema.virtual("totalSugar").get(function () {
  return this.foodItems.reduce((sum, item) => sum + (item.sugar || 0), 0);
});

mealLogSchema.virtual("totalSodium").get(function () {
  return this.foodItems.reduce((sum, item) => sum + (item.sodium || 0), 0);
});

// Compound index for efficient date-range queries per user
mealLogSchema.index({ user: 1, date: -1 });

export const MealLog = mongoose.model("MealLog", mealLogSchema);
