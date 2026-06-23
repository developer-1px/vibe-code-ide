/**
 * OpenFiles Feature - Atoms
 * IDE 탭 관리 상태
 */
import { atom } from 'jotai';
import { atomWithDefault } from 'jotai/utils';

// IDE Tab Management
export const openedTabsAtom = atom<string[]>([]); // 열린 탭들 (파일 경로)
export const activeTabAtom = atomWithDefault<string | null>(() => null); // 현재 활성 탭 (파일 경로)
