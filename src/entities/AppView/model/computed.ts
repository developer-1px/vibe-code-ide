interface FilePathNode {
  filePath: string;
}

export function getFilePathsForVisibleNodes<T extends FilePathNode>(
  visibleNodeIds: Set<string>,
  fullNodeMap: ReadonlyMap<string, T>
): Set<string> {
  const filePaths = new Set<string>();

  visibleNodeIds.forEach((nodeId) => {
    const node = fullNodeMap.get(nodeId);
    if (node) {
      filePaths.add(node.filePath);
    }
  });

  return filePaths;
}

export function getExpandedVisibleNodeIds(visibleNodeIds: Set<string>, openedFiles: Set<string>): Set<string> {
  if (openedFiles.size === 0) return visibleNodeIds;

  const expanded = new Set(visibleNodeIds);
  openedFiles.forEach((filePath) => {
    expanded.add(filePath);
  });

  return expanded;
}
