import type { DeadCodeCategoryInfo, DeadCodeCategoryKey, DeadCodeItem, DeadCodeResults } from '../model/types';

interface DeadCodeExplorerBaseNode {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  children?: DeadCodeExplorerNode[];
}

export interface DeadCodeExplorerCategoryNode extends DeadCodeExplorerBaseNode {
  type: 'category';
  categoryKey: DeadCodeCategoryKey;
  title: string;
  items: DeadCodeItem[];
}

export interface DeadCodeExplorerItemNode extends DeadCodeExplorerBaseNode {
  type: 'dead-code-item';
  filePath?: string;
  deadCodeItem: DeadCodeItem;
}

export type DeadCodeExplorerNode = DeadCodeExplorerCategoryNode | DeadCodeExplorerItemNode;

export function getDeadCodeItemKey(item: Pick<DeadCodeItem, 'filePath' | 'line' | 'symbolName'>): string {
  return `${item.filePath}:${item.line}:${item.symbolName}`;
}

export function getDeadCodeItems(deadCodeResults: DeadCodeResults | null | undefined): DeadCodeItem[] {
  if (!deadCodeResults) return [];

  return [
    ...deadCodeResults.unusedExports,
    ...deadCodeResults.unusedImports,
    ...deadCodeResults.deadFunctions,
    ...deadCodeResults.unusedVariables,
    ...deadCodeResults.unusedProps,
    ...deadCodeResults.unusedArguments,
  ];
}

export function getDeadCodeCategories(deadCodeResults: DeadCodeResults | null | undefined): DeadCodeCategoryInfo[] {
  if (!deadCodeResults) return [];

  return [
    { title: 'Unused Imports', items: deadCodeResults.unusedImports, key: 'unusedImports' },
    { title: 'Unused Variables', items: deadCodeResults.unusedVariables, key: 'unusedVariables' },
    { title: 'Dead Functions', items: deadCodeResults.deadFunctions, key: 'deadFunctions' },
    { title: 'Unused Arguments', items: deadCodeResults.unusedArguments, key: 'unusedArguments' },
    { title: 'Unused Props', items: deadCodeResults.unusedProps, key: 'unusedProps' },
    { title: 'Unused Exports', items: deadCodeResults.unusedExports, key: 'unusedExports' },
  ];
}

export function getSelectedDeadCodeItems(
  deadCodeResults: DeadCodeResults | null | undefined,
  selectedItemKeys: Set<string>
): DeadCodeItem[] {
  if (selectedItemKeys.size === 0) return [];

  return getDeadCodeItems(deadCodeResults).filter((item) => selectedItemKeys.has(getDeadCodeItemKey(item)));
}

export function getSelectedDeadCodeFilePaths(
  deadCodeResults: DeadCodeResults | null | undefined,
  selectedItemKeys: Set<string>
): string[] {
  const filePaths = new Set<string>();

  getSelectedDeadCodeItems(deadCodeResults, selectedItemKeys).forEach((item) => {
    filePaths.add(item.filePath);
  });

  return Array.from(filePaths).sort();
}

export function getSelectedDeadCodeLinesByFile(
  deadCodeResults: DeadCodeResults | null | undefined,
  selectedItemKeys: Set<string>
): Map<string, Set<number>> {
  const linesByFile = new Map<string, Set<number>>();

  getSelectedDeadCodeItems(deadCodeResults, selectedItemKeys).forEach((item) => {
    if (!linesByFile.has(item.filePath)) {
      linesByFile.set(item.filePath, new Set<number>());
    }
    linesByFile.get(item.filePath)?.add(item.line);
  });

  return linesByFile;
}

export function getDeadCodeExplorerTree(
  categories: DeadCodeCategoryInfo[],
  expandedCategories: Record<DeadCodeCategoryKey, boolean>
): DeadCodeExplorerNode[] {
  return categories.map((category) => {
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

    if (expandedCategories[category.key]) {
      categoryNode.children = getDeadCodeExplorerItemNodes(category.items, category.key);
    }

    return categoryNode;
  });
}

function getDeadCodeExplorerItemNodes(items: DeadCodeItem[], categoryKey: DeadCodeCategoryKey): DeadCodeExplorerNode[] {
  return items.map((item, index) => ({
    id: `${categoryKey}-item-${index}`,
    parentId: `category-${categoryKey}`,
    type: 'dead-code-item',
    name: item.symbolName,
    path: `${categoryKey}/${getDeadCodeItemKey(item)}`,
    filePath: item.filePath,
    deadCodeItem: item,
  }));
}
