/**
 * Get flat list of all visible items for keyboard navigation
 */
import type { FolderNode, FlatItem } from '../model/types';

export function getFlatItemList(
  fileTree: FolderNode[],
  collapsedFolders: Set<string>
): FlatItem[] {
  const items: FlatItem[] = [];

  const traverse = (nodes: FolderNode[]) => {
    nodes.forEach((node) => {
      if (node.type === 'folder') {
        items.push({ type: 'folder', path: node.path });
        if (!collapsedFolders.has(node.path) && node.children) {
          traverse(node.children);
        }
      } else if (node.type === 'file' && node.filePath) {
        items.push({ type: 'file', path: node.path, filePath: node.filePath });
      }
    });
  };

  traverse(fileTree);
  return items;
}
