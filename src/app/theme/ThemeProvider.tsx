/**
 * Unified Theme Provider
 * Manages both App and Editor themes together
 * Injects AppTheme colors as CSS variables for Tailwind
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { UnifiedTheme, AppTheme, EditorTheme } from './types';
import type { ThemeName } from './themes';
import { themes, defaultTheme } from './themes';
import { EditorThemeProvider } from './editor';

interface ThemeContextValue {
  theme: UnifiedTheme;
  themeName: ThemeName;
  appTheme: AppTheme;
  editorTheme: EditorTheme;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Hook to access current theme
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

/**
 * Hook to access app theme only
 */
export const useAppTheme = () => {
  const { appTheme } = useTheme();
  return appTheme;
};

/**
 * Unified Theme Provider
 * Wraps both App and Editor theme providers
 * Injects CSS variables for Tailwind to use
 */
export const ThemeProvider: React.FC<{
  children: ReactNode;
  initialTheme?: ThemeName;
}> = ({ children, initialTheme = 'default' }) => {
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);
  const theme = themes[themeName];

  // Set data-theme attribute for Tailwind v4 theme switching
  useEffect(() => {
    const root = document.documentElement;

    // Set data-theme attribute (for Tailwind v4)
    if (themeName === 'default') {
      root.removeAttribute('data-theme');
    } else {
      root.dataset.theme = themeName;
    }

    console.log('[ThemeProvider] Theme switched to:', themeName);
  }, [themeName]);

  const value: ThemeContextValue = {
    theme,
    themeName,
    appTheme: theme.app,
    editorTheme: theme.editor,
    setTheme: setThemeName,
  };

  return (
    <ThemeContext.Provider value={value}>
      <EditorThemeProvider theme={theme.editor}>
        {children}
      </EditorThemeProvider>
    </ThemeContext.Provider>
  );
};
