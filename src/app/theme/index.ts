/**
 * Unified Theme System - Public API
 */

// Types
export type { UnifiedTheme, AppTheme, EditorTheme } from './types';
export type { ThemeName } from './themes';

// Themes
export { themes, defaultTheme, jetbrainsTheme, vscodeTheme } from './themes';

// Providers and Hooks
export { ThemeProvider, useTheme, useAppTheme } from './ThemeProvider';
export { useEditorTheme } from './editor';

// App themes (for advanced usage)
export * from './app';

// Editor themes (for advanced usage)
export * from './editor';
