import { createContext, useContext, useState, useEffect } from 'react';

// Create User Preferences Context
const UserPreferencesContext = createContext();

// User Preferences Provider Component
export const UserPreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('userPreferences');
    return saved ? JSON.parse(saved) : {
      language: 'en',
      notifications: {
        email: true,
        push: true,
        workoutReminders: true,
        classReminders: true,
      },
      privacy: {
        showProfile: true,
        showWorkouts: true,
        showProgress: false,
      },
      display: {
        compactMode: false,
        showTips: true,
        autoPlayVideos: false,
      },
    };
  });

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  }, [preferences]);

  // Update preferences
  const updatePreferences = (updates) => {
    setPreferences(prev => ({
      ...prev,
      ...updates,
    }));
  };

  // Update notification preferences
  const updateNotificationPreferences = (updates) => {
    setPreferences(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...updates },
    }));
  };

  // Update privacy preferences
  const updatePrivacyPreferences = (updates) => {
    setPreferences(prev => ({
      ...prev,
      privacy: { ...prev.privacy, ...updates },
    }));
  };

  // Update display preferences
  const updateDisplayPreferences = (updates) => {
    setPreferences(prev => ({
      ...prev,
      display: { ...prev.display, ...updates },
    }));
  };

  // Reset to defaults
  const resetPreferences = () => {
    const defaultPreferences = {
      language: 'en',
      notifications: {
        email: true,
        push: true,
        workoutReminders: true,
        classReminders: true,
      },
      privacy: {
        showProfile: true,
        showWorkouts: true,
        showProgress: false,
      },
      display: {
        compactMode: false,
        showTips: true,
        autoPlayVideos: false,
      },
    };
    setPreferences(defaultPreferences);
  };

  const value = {
    preferences,
    updatePreferences,
    updateNotificationPreferences,
    updatePrivacyPreferences,
    updateDisplayPreferences,
    resetPreferences,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

// Custom hook to use preferences context
export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};

export default UserPreferencesContext;
