/**
 * VSCode App Theme
 * Based on Visual Studio Code's Dark+ theme for the app UI
 */

import type { AppTheme } from '../types';

export const vscodeAppTheme: AppTheme = {
  name: 'vscode',

  colors: {
    // VSCode Dark+ backgrounds
    background: 'bg-[#1E1E1E]',       // VSCode main background
    canvas: 'bg-[#1E1E1E]',           // Editor background (same)
    sidebar: 'bg-[#252526]',          // Sidebar background
    header: 'bg-[#323233]',           // Title bar

    // Text colors
    text: {
      primary: 'text-[#CCCCCC]',      // VSCode main text
      secondary: 'text-[#858585]',    // Dimmed text
      accent: 'text-[#007ACC]',       // VSCode blue
    },

    // Interactive elements
    border: 'border-[#2D2D30]',
    hover: 'hover:bg-[#2A2D2E]',
    active: 'bg-[#37373D]',

    // Status colors
    success: 'text-[#89D185]',        // Green
    warning: 'text-[#D7BA7D]',        // Yellow
    error: 'text-[#F48771]',          // Red
    info: 'text-[#75BEFF]',           // Blue
  },

  effects: {
    blur: 'backdrop-blur-sm',
    shadow: 'shadow-lg shadow-black/50',
  },
};
