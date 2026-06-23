import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import type { CategoryKey } from '@/pages/dead-code/widgets/DeadCodePanel/model/categoryState';
import type { DeadCodeItem } from '@/pages/shared/features/DeadCode/lib/deadCodeAnalyzer.ts';
import { deadCodeResultsAtom } from '@/pages/shared/features/DeadCode/model/atoms.ts';

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
