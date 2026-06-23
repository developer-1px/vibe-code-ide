/**
 * IDE Scroll View State
 * Tracks hovered file for right panel highlighting
 */

import { atomWithDefault } from 'jotai/utils';

/**
 * Currently hovered file path (via mouse hover)
 * Used to highlight the corresponding file in the right panel
 */
export const hoveredFilePathAtom = atomWithDefault<string | null>(() => null);
// IDE 모드에서 현재 포커스된 노드 ID
export const focusedNodeIdAtom = atomWithDefault<string | null>(() => null);
