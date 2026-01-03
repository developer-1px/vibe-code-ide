/**
 * App Theme - Atoms
 * 앱 테마 설정 관련 상태
 */
import { atom } from 'jotai';

// 테마 이름 타입
export type ThemeName = 'default' | 'jetbrains' | 'vscode';

// 현재 테마 atom
export const currentThemeAtom = atom<ThemeName>('default');
