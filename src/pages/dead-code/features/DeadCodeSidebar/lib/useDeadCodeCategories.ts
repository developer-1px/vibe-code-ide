import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { getDeadCodeCategories } from '@/entities/DeadCode/lib/computed';
import { deadCodeResultsAtom } from '@/entities/DeadCode/model/atoms';
import type { DeadCodeCategoryInfo } from '@/entities/DeadCode/model/types';

export function useDeadCodeCategories(): DeadCodeCategoryInfo[] {
  const deadCodeResults = useAtomValue(deadCodeResultsAtom);

  return useMemo(() => {
    return getDeadCodeCategories(deadCodeResults);
  }, [deadCodeResults]);
}
