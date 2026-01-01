/**
 * Default App Theme
 * Neutral gray-black tones for the entire application
 */

import type { AppTheme } from '../types';

export const defaultAppTheme: AppTheme = {
  name: 'default',

  colors: {
    // Main backgrounds - Semantic tokens
    background: 'bg-theme-background',
    canvas: 'bg-theme-canvas',
    sidebar: 'bg-theme-sidebar',
    header: 'bg-theme-header',

    // Text colors - Semantic tokens
    text: {
      primary: 'text-theme-text-primary',
      secondary: 'text-theme-text-secondary',
      accent: 'text-theme-text-accent',
    },

    // Interactive elements
    border: 'border-theme-border',
    hover: 'hover:bg-theme-hover',
    active: 'bg-theme-active',

    // Status colors
    success: 'text-theme-success',
    warning: 'text-theme-warning',
    error: 'text-theme-error',
    info: 'text-theme-info',
  },

  effects: {
    blur: 'backdrop-blur-sm',
    shadow: 'shadow-lg shadow-black/50',
  },
};
