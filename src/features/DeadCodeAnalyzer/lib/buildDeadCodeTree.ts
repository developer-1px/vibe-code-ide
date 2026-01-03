/**
 * Build nested folder tree from flat dead code items
 * Compatible with FolderNode structure used in FileTreeRenderer
 */
import type { FolderNode } from '../../../widgets/AppSidebar/model/types';
import type { DeadCodeItem } from '../../../shared/deadCodeAnalyzer';

export function buildDeadCodeTree(items: DeadCodeItem[]): FolderNode[] {
  const rootChildren: FolderNode[] = [];
  const folderMap = new Map<string, FolderNode>();

  // Group items by file path
  const fileMap = new Map<string, DeadCodeItem[]>();
  items.forEach(item => {
    const existing = fileMap.get(item.filePath) || [];
    existing.push(item);
    fileMap.set(item.filePath, existing);
  });

  // Build nested tree
  fileMap.forEach((fileItems, filePath) => {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];

    // Create file node
    const fileNode: FolderNode = {
      type: 'file',
      name: fileName,
      path: filePath,
      filePath: filePath
    };

    // If no folders (root file), add to root
    if (parts.length === 1) {
      rootChildren.push(fileNode);
      return;
    }

    // Build folder hierarchy
    let currentParent: FolderNode[] = rootChildren;
    let currentPath = '';

    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      // Find or create folder at current level
      let folder = currentParent.find(n => n.type === 'folder' && n.name === folderName);

      if (!folder) {
        folder = {
          type: 'folder',
          name: folderName,
          path: currentPath,
          children: []
        };
        currentParent.push(folder);
        folderMap.set(currentPath, folder);
      }

      // Move to next level
      currentParent = folder.children!;
    }

    // Add file to deepest folder
    currentParent.push(fileNode);
  });

  // Sort: folders first, then alphabetically
  const sortNodes = (nodes: FolderNode[]): FolderNode[] => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    nodes.forEach(node => {
      if (node.type === 'folder' && node.children) {
        sortNodes(node.children);
      }
    });

    return nodes;
  };

  return sortNodes(rootChildren);
}
