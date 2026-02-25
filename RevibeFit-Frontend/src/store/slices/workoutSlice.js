import { createSlice } from '@reduxjs/toolkit';

// Initial state for workouts
const initialState = {
  completedWorkouts: [],
  currentWorkout: null,
  workoutHistory: [],
  totalWorkoutsCompleted: 0,
  weeklyStats: {
    totalMinutes: 0,
    caloriesBurned: 0,
    workoutsThisWeek: 0,
  },
  loading: false,
  error: null,
};

// Workout Slice - Manages workout-related state
const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    // Set completed workouts
    setCompletedWorkouts: (state, action) => {
      state.completedWorkouts = action.payload;
      state.totalWorkoutsCompleted = action.payload.length;
      state.loading = false;
    },
    
    // Add a completed workout
    addCompletedWorkout: (state, action) => {
      state.completedWorkouts.unshift(action.payload);
      state.totalWorkoutsCompleted += 1;
      
      // Update weekly stats
      const workout = action.payload;
      state.weeklyStats.totalMinutes += workout.duration || 0;
      state.weeklyStats.caloriesBurned += workout.caloriesBurned || 0;
      state.weeklyStats.workoutsThisWeek += 1;
    },
    
    // Set current workout in progress
    setCurrentWorkout: (state, action) => {
      state.currentWorkout = action.payload;
    },
    
    // Clear current workout
    clearCurrentWorkout: (state) => {
      state.currentWorkout = null;
    },
    
    // Set workout history
    setWorkoutHistory: (state, action) => {
      state.workoutHistory = action.payload;
    },
    
    // Update weekly stats
    updateWeeklyStats: (state, action) => {
      state.weeklyStats = { ...state.weeklyStats, ...action.payload };
    },
    
    // Reset weekly stats (for new week)
    resetWeeklyStats: (state) => {
      state.weeklyStats = {
        totalMinutes: 0,
        caloriesBurned: 0,
        workoutsThisWeek: 0,
      };
    },
    
    // Set loading state
    setWorkoutLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    // Set error
    setWorkoutError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

// Export actions
export const {
  setCompletedWorkouts,
  addCompletedWorkout,
  setCurrentWorkout,
  clearCurrentWorkout,
  setWorkoutHistory,
  updateWeeklyStats,
  resetWeeklyStats,
  setWorkoutLoading,
  setWorkoutError,
} = workoutSlice.actions;

// Selectors
export const selectCompletedWorkouts = (state) => state.workout.completedWorkouts;
export const selectCurrentWorkout = (state) => state.workout.currentWorkout;
export const selectWorkoutHistory = (state) => state.workout.workoutHistory;
export const selectTotalWorkoutsCompleted = (state) => state.workout.totalWorkoutsCompleted;
export const selectWeeklyStats = (state) => state.workout.weeklyStats;
export const selectWorkoutLoading = (state) => state.workout.loading;
export const selectWorkoutError = (state) => state.workout.error;

export default workoutSlice.reducer;
