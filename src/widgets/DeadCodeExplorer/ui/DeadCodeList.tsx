/**
 * DeadCodeList - List of all categories
 */
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useAtomValue } from 'jotai';
import { deadCodeResultsAtom } from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/model/atoms';
import { isAnalyzingAtom, collapsedFoldersAtom } from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/model/atoms';
import { buildDeadCodeTree } from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/lib/buildDeadCodeTree';
import { DeadCodeCategory } from './DeadCodeCategory';
import { useCategoryIndices } from '../lib/useCategoryIndices';
import { useMemo } from 'react';

export function DeadCodeList({ itemRefs }: { itemRefs: React.MutableRefObject<Map<number, HTMLDivElement>> }) {
  const deadCodeResults = useAtomValue(deadCodeResultsAtom);
  const isAnalyzing = useAtomValue(isAnalyzingAtom);
  const collapsedFolders = useAtomValue(collapsedFoldersAtom);
  const categories = useCategoryIndices();

  // Build combined flat list for all categories
  const allCategoryItems = useMemo(() => {
    if (!deadCodeResults) return [];
    return [
      ...deadCodeResults.unusedImports,
      ...deadCodeResults.unusedVariables,
      ...deadCodeResults.deadFunctions,
      ...deadCodeResults.unusedExports,
    ];
  }, [deadCodeResults]);

  const allCategoryTree = useMemo(
    () => buildDeadCodeTree(allCategoryItems),
    [allCategoryItems]
  );

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-2">
        {deadCodeResults && !isAnalyzing && categories.map(({ title, items, key, startIndex }) => (
          <DeadCodeCategory
            key={key}
            title={title}
            items={items}
            categoryKey={key}
            startIndex={startIndex}
            itemRefs={itemRefs}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
