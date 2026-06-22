/**
 * RelatedFilesView - Shows files related to the active file
 * Displays dependencies (imports) and dependents (imported by) in separate sections
 */

import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { filesAtom, fullNodeMapAtom } from '@/entities/AppView/model/atoms';
import { getDependencies, getDependents } from '@/entities/SourceFileNode/lib/getters';
import { activeTabAtom } from '@/features/File/OpenFiles/model/atoms';
import { resolvePath } from '@/shared/tsParser/utils/pathResolver';
import { RelatedFilesSection } from './RelatedFilesSection';

export function RelatedFilesView() {
  const files = useAtomValue(filesAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const activeTab = useAtomValue(activeTabAtom);

  // Calculate dependencies and dependents for active file
  const { dependencies, dependents } = useMemo(() => {
    if (!activeTab || !fullNodeMap.has(activeTab)) {
      return { dependencies: [], dependents: [] };
    }

    const node = fullNodeMap.get(activeTab);
    if (!node || node.type !== 'file') {
      return { dependencies: [], dependents: [] };
    }

    const deps = getDependencies(node, files, resolvePath);
    const dependentsFiles = getDependents(activeTab, fullNodeMap, files, resolvePath);

    return {
      dependencies: deps,
      dependents: dependentsFiles,
    };
  }, [activeTab, fullNodeMap, files]);

  // Filter files to only include dependencies
  const dependenciesFiles = useMemo(() => {
    const filtered: Record<string, string> = {};
    dependencies.forEach((filePath) => {
      if (files[filePath]) {
        filtered[filePath] = files[filePath];
      }
    });
    return filtered;
  }, [dependencies, files]);

  // Filter files to only include dependents
  const dependentsFilesRecord = useMemo(() => {
    const filtered: Record<string, string> = {};
    dependents.forEach((filePath) => {
      if (files[filePath]) {
        filtered[filePath] = files[filePath];
      }
    });
    return filtered;
  }, [dependents, files]);

  if (!activeTab) {
    return (
      <div className="flex-1 flex items-center justify-center px-3 py-6 text-xs text-text-secondary text-center">
        Open a file to see related files
      </div>
    );
  }

  if (dependencies.length === 0 && dependents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-3 py-6 text-xs text-text-secondary text-center">
        No related files found
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Dependencies Section */}
      {dependencies.length > 0 && (
        <RelatedFilesSection title="Dependencies" count={dependencies.length} files={dependenciesFiles} />
      )}

      {/* Dependents Section */}
      {dependents.length > 0 && (
        <RelatedFilesSection title="Dependents" count={dependents.length} files={dependentsFilesRecord} />
      )}
    </div>
  );
}
