import { createSlice } from '@reduxjs/toolkit';

// Initial state for authentication
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: !!localStorage.getItem('user'),
  userType: JSON.parse(localStorage.getItem('user'))?.userType || null,
  loading: false,
  error: null,
};

// Auth Slice - Manages authentication state
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Login action - stores user and token
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.userType = action.payload.user.userType;
      state.loading = false;
      state.error = null;
      
      // Sync with localStorage for persistence
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('accessToken', action.payload.accessToken);
    },
    
    // Login start - set loading state
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    
    // Login failure - set error
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    
    // Logout action - clears all auth data
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.userType = null;
      state.loading = false;
      state.error = null;
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    },
    
    // Update user profile
    updateUserProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    
    // Sync from localStorage (for cross-tab communication)
    syncFromStorage: (state) => {
      const user = JSON.parse(localStorage.getItem('user'));
      const accessToken = localStorage.getItem('accessToken');
      
      if (user && accessToken) {
        state.user = user;
        state.accessToken = accessToken;
        state.isAuthenticated = true;
        state.userType = user.userType;
      } else {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.userType = null;
      }
    },
  },
});

// Export actions
export const {
  loginSuccess,
  loginStart,
  loginFailure,
  logout,
  updateUserProfile,
  syncFromStorage,
} = authSlice.actions;

// Selectors for accessing state
export const selectUser = (state) => state.auth.user;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserType = (state) => state.auth.userType;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
