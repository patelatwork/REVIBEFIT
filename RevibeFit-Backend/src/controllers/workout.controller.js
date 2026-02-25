import CompletedWorkout from "../models/completedWorkout.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// @desc    Save completed workout
// @route   POST /api/workouts/complete
// @access  Private (Fitness Enthusiast)
export const saveCompletedWorkout = asyncHandler(async (req, res) => {
  const { workoutId, workoutTitle, duration, difficulty, category, exercisesCompleted } = req.body;

  if (!workoutId || !workoutTitle || !duration || !difficulty || !exercisesCompleted) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const completedWorkout = await CompletedWorkout.create({
    userId: req.user._id,
    workoutId,
    workoutTitle,
    duration,
    difficulty,
    category,
    exercisesCompleted,
  });

  res.status(201).json(
    new ApiResponse(201, completedWorkout, "Workout completion saved successfully")
  );
});

// @desc    Get user's completed workouts
// @route   GET /api/workouts/completed
// @access  Private (Fitness Enthusiast)
export const getCompletedWorkouts = asyncHandler(async (req, res) => {
  const completedWorkouts = await CompletedWorkout.find({ userId: req.user._id })
    .sort({ completedAt: -1 });

  res.status(200).json(
    new ApiResponse(200, completedWorkouts, "Completed workouts retrieved successfully")
  );
});

// @desc    Delete completed workout
// @route   DELETE /api/workouts/completed/:id
// @access  Private (Fitness Enthusiast)
export const deleteCompletedWorkout = asyncHandler(async (req, res) => {
  const completedWorkout = await CompletedWorkout.findById(req.params.id);

  if (!completedWorkout) {
    throw new ApiError(404, "Completed workout not found");
  }

  // Check if the workout belongs to the user
  if (completedWorkout.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to delete this workout");
  }

  await completedWorkout.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, "Completed workout deleted successfully")
  );
});
