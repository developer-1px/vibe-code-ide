import { atom } from 'jotai';
import type { DeadCodeResults } from '@/pages/shared/features/DeadCode/lib/deadCodeAnalyzer';

export const deadCodeResultsAtom = atom<DeadCodeResults | null>(null);

// 선택된 dead code 항목들 (filePath:line:symbolName)
export const selectedDeadCodeItemsAtom = atom(new Set<string>());
