import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import type { DeadCodeItem } from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/lib/deadCodeAnalyzer.ts';
import { deadCodeResultsAtom } from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/model/atoms.ts';
import type { CategoryKey } from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/model/types.ts';

interface DeadCodeCategoryInfo {
  title: string;
  items: DeadCodeItem[];
  key: CategoryKey;
}

export function useDeadCodeCategories(): DeadCodeCategoryInfo[] {
  const deadCodeResults = useAtomValue(deadCodeResultsAtom);

  return useMemo(() => {
    if (!deadCodeResults) return [];

    return [
      { title: 'Unused Imports', items: deadCodeResults.unusedImports, key: 'unusedImports' },
      { title: 'Unused Variables', items: deadCodeResults.unusedVariables, key: 'unusedVariables' },
      { title: 'Dead Functions', items: deadCodeResults.deadFunctions, key: 'deadFunctions' },
      { title: 'Unused Arguments', items: deadCodeResults.unusedArguments, key: 'unusedArguments' },
      { title: 'Unused Props', items: deadCodeResults.unusedProps, key: 'unusedProps' },
      { title: 'Unused Exports', items: deadCodeResults.unusedExports, key: 'unusedExports' },
    ];
  }, [deadCodeResults]);
}
