/**
 * Get flat list of all visible items in dead code tree for keyboard navigation
 */
import type { FolderNode } from '../../AppSidebar/model/types';
import type { FlatItem } from '../../AppSidebar/model/types';

export function getDeadCodeFlatList(
  tree: FolderNode[],
  collapsedFolders: Set<string>
): FlatItem[] {
  const result: FlatItem[] = [];

  function traverse(nodes: FolderNode[]) {
    nodes.forEach((node) => {
      // Add current node
      result.push({
        type: node.type,
        path: node.path,
        filePath: node.filePath,
      });

      // If folder is open and has children, traverse them
      if (
        node.type === 'folder' &&
        !collapsedFolders.has(node.path) &&
        node.children
      ) {
        traverse(node.children);
      }
    });
  }

  traverse(tree);
  return result;
}
