import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { getDeadCodeCategories } from '@/entities/DeadCode/lib/computed';
import type { DeadCodeCategoryInfo } from '@/entities/DeadCode/model/types';
import { deadCodeResultsAtom } from '@/pages/shared/features/DeadCode/model/atoms.ts';

export function useDeadCodeCategories(): DeadCodeCategoryInfo[] {
  const deadCodeResults = useAtomValue(deadCodeResultsAtom);

  return useMemo(() => {
    return getDeadCodeCategories(deadCodeResults);
  }, [deadCodeResults]);
}
