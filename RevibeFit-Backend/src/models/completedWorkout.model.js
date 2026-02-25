import mongoose from "mongoose";

const completedWorkoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workoutId: {
      type: String,
      required: true,
    },
    workoutTitle: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
    },
    category: {
      type: String,
    },
    exercisesCompleted: {
      type: Number,
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
completedWorkoutSchema.index({ userId: 1, completedAt: -1 });

const CompletedWorkout = mongoose.model("CompletedWorkout", completedWorkoutSchema);

export default CompletedWorkout;
