import { atom } from 'jotai';
import { atomWithDefault } from 'jotai/utils';
import type { DeadCodeResults } from '@/entities/DeadCode/model/types';

export const deadCodeResultsAtom = atomWithDefault<DeadCodeResults | null>(() => null);

// 선택된 dead code 항목들 (filePath:line:symbolName)
export const selectedDeadCodeItemsAtom = atom<Set<string>>(new Set<string>());
