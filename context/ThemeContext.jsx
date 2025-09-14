import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const THEME_PREFERENCE_KEY = '@theme_preference';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme(); // 'dark', 'light', or null
  const [themePreference, setThemePreference] = useState('auto'); // 'light', 'dark', 'auto'
  const [isThemeLoading, setIsThemeLoading] = useState(true);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (storedPreference) {
          setThemePreference(storedPreference);
        }
      } catch (e) {
        console.error('[ThemeContext] Błąd wczytywania preferencji motywu:', e);
      } finally {
        setIsThemeLoading(false);
      }
    };
    loadThemePreference();
  }, []);

  const updateThemePreference = async (newPreference) => {
    try {
      setThemePreference(newPreference);
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, newPreference);
    } catch (e) {
      console.error('[ThemeContext] Błąd zapisywania preferencji motywu:', e);
    }
  };

  const theme = useMemo(() => {
    if (themePreference === 'light') {
      return MD3LightTheme;
    }
    if (themePreference === 'dark') {
      return MD3DarkTheme;
    }
    // 'auto'
    return colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  }, [themePreference, colorScheme]);

  if (isThemeLoading) {
    return null;
  }

  const value = {
    theme,
    themePreference,
    updateThemePreference,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => useContext(ThemeContext);