/**
 * DeadCodeExplorer - Dead code navigation component
 * Single TreeView with all categories for unified keyboard navigation
 */

import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { isAnalyzingAtom } from '@/pages/dead-code/features/DeadCodeAnalysis/model/atoms.ts';
import { type CategoryKey, expandedCategoriesAtom } from '@/pages/dead-code/widgets/DeadCodePanel/model/categoryState';
import type { DeadCodeItem } from '@/pages/shared/features/DeadCode/lib/deadCodeAnalyzer.ts';
import { deadCodeResultsAtom } from '@/pages/shared/features/DeadCode/model/atoms.ts';
import { useTreeKeyboardNavigation } from '@/shared/hooks/useTreeKeyboardNavigation.ts';
import { TreeView } from '@/shared/ui/TreeView/TreeView.tsx';
import { useDeadCodeCategories } from '../lib/useDeadCodeCategories.ts';
import { DeadCodeCategoryHeader } from './DeadCodeCategoryHeader.tsx';
import { DeadCodeResultItem } from './DeadCodeResultItem.tsx';

interface DeadCodeExplorerBaseNode {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  children?: DeadCodeExplorerNode[];
}

interface DeadCodeExplorerCategoryNode extends DeadCodeExplorerBaseNode {
  type: 'category';
  categoryKey: CategoryKey;
  title: string;
  items: DeadCodeItem[];
}

interface DeadCodeExplorerItemNode extends DeadCodeExplorerBaseNode {
  type: 'dead-code-item';
  filePath?: string;
  deadCodeItem: DeadCodeItem;
}

type DeadCodeExplorerNode = DeadCodeExplorerCategoryNode | DeadCodeExplorerItemNode;

export function DeadCodeExplorer() {
  const deadCodeResults = useAtomValue(deadCodeResultsAtom);
  const isAnalyzing = useAtomValue(isAnalyzingAtom);
  const expandedCategories = useAtomValue(expandedCategoriesAtom);

  // Get all categories
  const categories = useDeadCodeCategories();

  // Build unified tree with all categories
  const unifiedTree = useMemo(() => {
    const tree: DeadCodeExplorerNode[] = [];

    categories.forEach((category) => {
      // Add category header node with children
      const categoryNode: DeadCodeExplorerNode = {
        id: `category-${category.key}`,
        parentId: null,
        type: 'category',
        name: category.title,
        path: `category-${category.key}`,
        categoryKey: category.key,
        title: category.title,
        items: category.items,
      };

      // If category is expanded, add children
      if (expandedCategories[category.key]) {
        categoryNode.children = buildDeadCodeTreeWithCategory(category.items, category.key);
      }

      tree.push(categoryNode);
    });

    return tree;
  }, [categories, expandedCategories]);

  // Flat list for keyboard navigation (all visible items)
  const flatItemList = useMemo(() => unifiedTree, [unifiedTree]);

  // Keyboard navigation
  const { focusedIndex, setFocusedIndex, itemRefs } = useTreeKeyboardNavigation({
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
    <TreeView
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

// Helper to build tree with category prefix
function buildDeadCodeTreeWithCategory(items: DeadCodeItem[], categoryKey: string): DeadCodeExplorerNode[] {
  // Simplified - just create dead-code-item nodes
  // You can enhance this with folder grouping if needed
  return items.map((item, idx) => ({
    id: `${categoryKey}-item-${idx}`,
    parentId: `category-${categoryKey}`,
    type: 'dead-code-item',
    name: item.symbolName,
    // Include symbolName in path to ensure uniqueness (same file/line can have multiple items)
    path: `${categoryKey}/${item.filePath}:${item.line}:${item.symbolName}`,
    filePath: item.filePath,
    deadCodeItem: item,
  }));
}
