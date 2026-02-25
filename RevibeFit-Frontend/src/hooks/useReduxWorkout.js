import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import {
  setCompletedWorkouts,
  addCompletedWorkout,
  setCurrentWorkout,
  clearCurrentWorkout,
  updateWeeklyStats,
  selectCompletedWorkouts,
  selectCurrentWorkout,
  selectWeeklyStats,
  selectTotalWorkoutsCompleted,
} from '../store/slices/workoutSlice';

/**
 * Custom hook for Redux workout management
 * Provides easy access to workout state and actions
 */
export const useReduxWorkout = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const completedWorkouts = useSelector(selectCompletedWorkouts);
  const currentWorkout = useSelector(selectCurrentWorkout);
  const weeklyStats = useSelector(selectWeeklyStats);
  const totalCompleted = useSelector(selectTotalWorkoutsCompleted);

  // Load completed workouts
  const loadCompletedWorkouts = useCallback(async (token) => {
    try {
      const response = await fetch('http://localhost:8000/api/workouts/completed', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        dispatch(setCompletedWorkouts(data.data));
      }
    } catch (err) {
      console.error('Error loading completed workouts:', err);
    }
  }, [dispatch]);

  // Add completed workout
  const addWorkout = useCallback((workout) => {
    dispatch(addCompletedWorkout(workout));
  }, [dispatch]);

  // Set current workout
  const setWorkout = useCallback((workout) => {
    dispatch(setCurrentWorkout(workout));
  }, [dispatch]);

  // Clear current workout
  const clearWorkout = useCallback(() => {
    dispatch(clearCurrentWorkout());
  }, [dispatch]);

  // Update stats
  const updateStats = useCallback((stats) => {
    dispatch(updateWeeklyStats(stats));
  }, [dispatch]);

  return {
    completedWorkouts,
    currentWorkout,
    weeklyStats,
    totalCompleted,
    loadCompletedWorkouts,
    addWorkout,
    setWorkout,
    clearWorkout,
    updateStats,
  };
};

export default useReduxWorkout;
