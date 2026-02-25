import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import {
  loginSuccess,
  loginStart,
  loginFailure,
  logout,
  updateUserProfile,
  selectUser,
  selectAccessToken,
  selectIsAuthenticated,
  selectUserType,
  selectAuthLoading,
  selectAuthError,
} from '../store/slices/authSlice';

/**
 * Custom hook for Redux authentication
 * Provides easy access to auth state and actions
 */
export const useReduxAuth = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const user = useSelector(selectUser);
  const accessToken = useSelector(selectAccessToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userType = useSelector(selectUserType);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  // Login function
  const login = useCallback(async (credentials) => {
    dispatch(loginStart());
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      dispatch(loginSuccess({
        user: data.data.user,
        accessToken: data.data.accessToken,
      }));
      
      return { success: true, data: data.data };
    } catch (err) {
      dispatch(loginFailure(err.message));
      return { success: false, error: err.message };
    }
  }, [dispatch]);

  // Logout function
  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  // Update user profile
  const updateProfile = useCallback((updates) => {
    dispatch(updateUserProfile(updates));
  }, [dispatch]);

  return {
    user,
    accessToken,
    isAuthenticated,
    userType,
    loading,
    error,
    login,
    logout: handleLogout,
    updateProfile,
  };
};

export default useReduxAuth;
