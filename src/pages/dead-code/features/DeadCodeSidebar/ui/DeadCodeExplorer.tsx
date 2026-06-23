/**
 * DeadCodeExplorer - Dead code navigation component
 * Single TreeView with all categories for unified keyboard navigation
 */

import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { type DeadCodeExplorerNode, getDeadCodeExplorerTree } from '@/entities/DeadCode/lib/computed';
import { deadCodeResultsAtom } from '@/entities/DeadCode/model/atoms';
import { isAnalyzingAtom } from '@/pages/dead-code/features/DeadCodeAnalysis/model/atoms.ts';
import { expandedCategoriesAtom } from '@/pages/dead-code/features/DeadCodeSidebar/model/categoryState';
import { useTreeKeyboardNavigation } from '@/shared/hooks/useTreeKeyboardNavigation.ts';
import { TreeView } from '@/shared/ui/TreeView/TreeView.tsx';
import { useDeadCodeCategories } from '../lib/useDeadCodeCategories.ts';
import { DeadCodeCategoryHeader } from './DeadCodeCategoryHeader.tsx';
import { DeadCodeResultItem } from './DeadCodeResultItem.tsx';

export function DeadCodeExplorer() {
  const deadCodeResults = useAtomValue(deadCodeResultsAtom);
  const isAnalyzing = useAtomValue(isAnalyzingAtom);
  const expandedCategories = useAtomValue(expandedCategoriesAtom);

  // Get all categories
  const categories = useDeadCodeCategories();

  // Build unified tree with all categories
  const unifiedTree = useMemo(() => {
    return getDeadCodeExplorerTree(categories, expandedCategories);
  }, [categories, expandedCategories]);

  // Flat list for keyboard navigation (all visible items)
  const flatItemList = useMemo(() => unifiedTree, [unifiedTree]);

  // Keyboard navigation
  const { focusedIndex, setFocusedIndex, itemRefs } = useTreeKeyboardNavigation<DeadCodeExplorerNode>({
    flatItemList,
    collapsedFolders: new Set(), // No folders
    onToggleFolder: toggleFolder, // No folders
    onItemAction: activateItem, // Handled by item itself
  });

  function toggleFolder() {}

  function activateItem() {}

  function changeFocusedIndex(nextFocusedIndex: number) {
    setFocusedIndex(nextFocusedIndex);
  }

  if (!deadCodeResults || isAnalyzing) {
    return null;
  }

  if (categories.length === 0 || categories.every((cat) => cat.items.length === 0)) {
    return <div className="px-3 py-6 text-xs text-text-secondary text-center">No dead code found</div>;
  }

  return (
    <TreeView<DeadCodeExplorerNode>
      className="flex-1 min-h-0 overflow-y-auto"
      data={unifiedTree}
      getNodeType={(node) => node.type}
      getNodePath={(node) => node.path}
      getNodeChildren={(node) => node.children || []}
      collapsedPaths={new Set()}
      toggleCollapse={toggleFolder}
      focusedIndex={focusedIndex}
      changeFocus={changeFocusedIndex}
      itemRefs={itemRefs}
    >
      {({ node, depth, isFocused, itemRef, handleFocus }) => {
        // Category header
        if (node.type === 'category') {
          return (
            <DeadCodeCategoryHeader
              ref={itemRef}
              title={node.title}
              items={node.items}
              categoryKey={node.categoryKey}
              focused={isFocused}
              onFocus={handleFocus}
            />
          );
        }

        // Dead code item
        if (node.type === 'dead-code-item' && node.deadCodeItem) {
          return (
            <DeadCodeResultItem
              ref={itemRef}
              item={node.deadCodeItem}
              depth={depth}
              focused={isFocused}
              onFocus={handleFocus}
            />
          );
        }

        return null;
      }}
    </TreeView>
  );
}
