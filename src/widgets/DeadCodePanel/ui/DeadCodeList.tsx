/**
 * DeadCodeList - List of all categories
 */
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useAtomValue } from 'jotai';
import { deadCodeResultsAtom } from '../../../store/atoms';
import { isAnalyzingAtom, collapsedFoldersAtom } from '../../../features/DeadCodeAnalyzer/model/atoms';
import { buildDeadCodeTree } from '../../../features/DeadCodeAnalyzer/lib/buildDeadCodeTree';
import { getDeadCodeFlatList } from '../lib/getDeadCodeFlatList';
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

  const flatItemList = useMemo(
    () => getDeadCodeFlatList(allCategoryTree, collapsedFolders, allCategoryItems),
    [allCategoryTree, collapsedFolders, allCategoryItems]
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
