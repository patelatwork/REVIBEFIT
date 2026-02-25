import { createContext, useContext, useState, useEffect } from 'react';

// Create Theme Context
const ThemeContext = createContext();

// Theme configurations
const themes = {
  light: {
    primary: '#3f8554',
    secondary: '#225533',
    background: '#ffffff',
    text: '#1f2937',
    navbar: '#fffff0',
    card: '#f9fafb',
    border: '#e5e7eb',
  },
  dark: {
    primary: '#4ade80',
    secondary: '#22c55e',
    background: '#1f2937',
    text: '#f3f4f6',
    navbar: '#111827',
    card: '#374151',
    border: '#4b5563',
  },
};

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'medium';
  });
  
  const [contrast, setContrast] = useState(() => {
    return localStorage.getItem('contrast') || 'normal';
  });

  // Toggle between light and dark theme
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  // Change font size
  const changeFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
  };
  
  // Change contrast
  const changeContrast = (contrastLevel) => {
    setContrast(contrastLevel);
    localStorage.setItem('contrast', contrastLevel);
  };

  // Get current theme colors
  const currentTheme = themes[theme];

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.setAttribute('data-contrast', contrast);
  }, [theme, fontSize, contrast]);

  const value = {
    theme,
    toggleTheme,
    currentTheme,
    fontSize,
    changeFontSize,
    contrast,
    changeContrast,
    isDarkMode: theme === 'dark',
    isLightMode: theme === 'light',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
