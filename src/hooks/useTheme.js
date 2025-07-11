// Theme management hook
import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../lib/database.js';

export function useTheme() {
  const [theme, setTheme] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await getSetting('theme', 'system');
        setTheme(savedTheme);
        updateResolvedTheme(savedTheme);
      } catch (error) {
        console.error('Failed to load theme:', error);
        setTheme('system');
        updateResolvedTheme('system');
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Update resolved theme based on theme preference
  const updateResolvedTheme = (themeValue) => {
    let resolved;
    
    if (themeValue === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = themeValue;
    }
    
    setResolvedTheme(resolved);
    
    // Update DOM
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        updateResolvedTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Change theme
  const changeTheme = async (newTheme) => {
    try {
      await setSetting('theme', newTheme);
      setTheme(newTheme);
      updateResolvedTheme(newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  // Toggle between light and dark (ignoring system)
  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    changeTheme(newTheme);
  };

  return {
    theme,
    resolvedTheme,
    isLoading,
    changeTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system'
  };
} 