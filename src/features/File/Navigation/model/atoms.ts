/**
 * Navigation Feature - Atoms
 * 코드 네비게이션 관련 상태 atoms (Go to Definition 등)
 */
import { atom } from 'jotai';

/**
 * Go to Definition - 타겟 라인 하이라이트 및 스크롤
 *
 * 사용처:
 * - useOpenFile: 파일 열 때 특정 라인으로 스크롤
 * - CodeLineView: 타겟 라인 하이라이트
 * - DeadCodeExplorer: dead code 항목 클릭 시 해당 라인으로 이동
 */
export const targetLineAtom = atom(null as { nodeId: string; lineNum: number } | null);
