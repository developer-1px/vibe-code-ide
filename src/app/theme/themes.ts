/**
 * Unified Themes
 * Combines App and Editor themes into complete theme configurations
 */

import type { UnifiedTheme } from './types';
import { defaultAppTheme, jetbrainsAppTheme, vscodeAppTheme } from './app';
import { defaultTheme as defaultEditorTheme, jetbrainsTheme as jetbrainsEditorTheme, vscodeTheme as vscodeEditorTheme } from './editor';

export const defaultTheme: UnifiedTheme = {
  name: 'default',
  app: defaultAppTheme,
  editor: defaultEditorTheme,
};

export const jetbrainsTheme: UnifiedTheme = {
  name: 'jetbrains',
  app: jetbrainsAppTheme,
  editor: jetbrainsEditorTheme,
};

export const vscodeTheme: UnifiedTheme = {
  name: 'vscode',
  app: vscodeAppTheme,
  editor: vscodeEditorTheme,
};

export const themes = {
  default: defaultTheme,
  jetbrains: jetbrainsTheme,
  vscode: vscodeTheme,
} as const;

export type ThemeName = keyof typeof themes;
