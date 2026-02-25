import mongoose from "mongoose";

const labTestSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
      required: [true, "Test name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Test description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Test price is required"],
      min: [0, "Price must be positive"],
    },
    duration: {
      type: String, // e.g., "30 minutes", "1 hour", "2-3 days for results"
      required: [true, "Test duration is required"],
    },
    labPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Lab partner ID is required"],
    },
    category: {
      type: String,
      enum: ["Blood Test", "Urine Test", "Imaging", "Fitness Assessment", "Cardiac Test", "Other"],
      default: "Other",
    },
    preparationInstructions: {
      type: String,
      default: "No special preparation required",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
labTestSchema.index({ labPartnerId: 1, isActive: 1 });
labTestSchema.index({ testName: 'text', description: 'text' });

export const LabTest = mongoose.model("LabTest", labTestSchema);
