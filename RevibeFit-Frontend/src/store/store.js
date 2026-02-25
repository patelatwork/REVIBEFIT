import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import workoutReducer from './slices/workoutSlice';
import blogReducer from './slices/blogSlice';

// Redux Store Configuration
// This store manages global application state using Redux Toolkit
export const store = configureStore({
  reducer: {
    auth: authReducer,
    workout: workoutReducer,
    blog: blogReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['auth/loginSuccess', 'workout/setCurrentWorkout'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
