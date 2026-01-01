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

  // Inject CSS variables whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    const { colors } = theme.app;

    // Backgrounds
    root.style.setProperty('--theme-background', colors.background);
    root.style.setProperty('--theme-canvas', colors.canvas);
    root.style.setProperty('--theme-sidebar', colors.sidebar);
    root.style.setProperty('--theme-header', colors.header);
    root.style.setProperty('--theme-panel', colors.panel);

    // Borders
    root.style.setProperty('--theme-border', colors.border.DEFAULT);
    root.style.setProperty('--theme-border-subtle', colors.border.subtle);
    root.style.setProperty('--theme-border-strong', colors.border.strong);

    // Text
    root.style.setProperty('--theme-text-primary', colors.text.primary);
    root.style.setProperty('--theme-text-secondary', colors.text.secondary);
    root.style.setProperty('--theme-text-tertiary', colors.text.tertiary);
    root.style.setProperty('--theme-text-accent', colors.text.accent);

    // Interactive states
    root.style.setProperty('--theme-hover', colors.hover);
    root.style.setProperty('--theme-active', colors.active);
    root.style.setProperty('--theme-focus', colors.focus);

    // Status colors
    root.style.setProperty('--theme-success', colors.success);
    root.style.setProperty('--theme-warning', colors.warning);
    root.style.setProperty('--theme-error', colors.error);
    root.style.setProperty('--theme-info', colors.info);

    // Special colors
    root.style.setProperty('--theme-purple', colors.purple);
    root.style.setProperty('--theme-amber', colors.amber);
    root.style.setProperty('--theme-emerald', colors.emerald);

    console.log('[ThemeProvider] CSS variables injected for theme:', themeName);
  }, [theme, themeName]);

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
