import type { SourceFileNode } from '@/entities/SourceFileNode/model/types.ts';

/**
 * Calculates which nodes are still reachable from the Entry File or Template Root.
 * Any node currently in `visibleSet` that cannot be reached is considered an
 * orphan and removed.
 */
export const pruneDetachedNodes = (
  visibleSet: Set<string>,
  nodeMap: Map<string, SourceFileNode>,
  entryFile: string | null,
  templateRootId: string | null
): Set<string> => {
  const visited = new Set<string>();
  const queue: string[] = [];

  visibleSet.forEach((id) => {
    const node = nodeMap.get(id);
    if (!node) return;

    const isEntryPoint = node.filePath === entryFile;
    const isTemplateRoot = id === templateRootId;

    if (isEntryPoint || isTemplateRoot) {
      if (!visited.has(id)) {
        visited.add(id);
        queue.push(id);
      }
    }
  });

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const node = nodeMap.get(currentId);

    if (node) {
      node.dependencies.forEach((depId) => {
        if (visibleSet.has(depId) && !visited.has(depId)) {
          visited.add(depId);
          queue.push(depId);
        }
      });
    }
  }

  return visited;
};
