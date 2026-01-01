/**
 * JetBrains App Theme
 * Based on IntelliJ IDEA's Darcula theme for the app UI
 */

import type { AppTheme } from '../types';

export const jetbrainsAppTheme: AppTheme = {
  name: 'jetbrains',

  colors: {
    // JetBrains Darcula backgrounds
    background: 'bg-[#2B2B2B]',       // Darcula main background
    canvas: 'bg-[#313335]',           // Editor area background
    sidebar: 'bg-[#3C3F41]',          // Tool window background
    header: 'bg-[#3C3F41]',           // Same as sidebar

    // Text colors
    text: {
      primary: 'text-[#A9B7C6]',      // Darcula main text
      secondary: 'text-[#808080]',    // Muted text
      accent: 'text-[#6897BB]',       // Darcula blue accent
    },

    // Interactive elements
    border: 'border-[#323232]',
    hover: 'hover:bg-[#4B5254]',
    active: 'bg-[#4B5254]',

    // Status colors
    success: 'text-[#629755]',        // Green
    warning: 'text-[#BBB529]',        // Yellow
    error: 'text-[#BC3F3C]',          // Red
    info: 'text-[#6897BB]',           // Blue
  },

  effects: {
    blur: 'backdrop-blur-sm',
    shadow: 'shadow-lg shadow-black/50',
  },
};
