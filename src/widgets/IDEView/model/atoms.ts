/**
 * IDEView Widget - Atoms
 * IDE 뷰 Outline Panel 상태 및 포커스 노드
 */
import { atom } from 'jotai';

// Outline Panel 열림/닫힘 상태 (기본: 코드 보기)
export const outlinePanelOpenAtom = atom(false);

// IDE 모드에서 현재 포커스된 노드 ID
export const focusedNodeIdAtom = atom<string | null>(null);
