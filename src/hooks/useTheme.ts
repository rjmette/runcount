import { useState, useEffect, useCallback } from 'react';

import { safeGet, safeSet } from '../utils/storage';

/**
 * Custom hook for managing dark mode theme
 * Persists theme preference to localStorage
 */
export const useTheme = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = safeGet('runcount_theme');
    return savedTheme ? savedTheme === 'dark' : true; // Default to dark if no theme is saved
  });

  const toggleDarkMode = useCallback(() => setDarkMode(!darkMode), [darkMode]);

  // Update theme when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      safeSet('runcount_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      safeSet('runcount_theme', 'light');
    }
  }, [darkMode]);

  return { darkMode, toggleDarkMode };
};
