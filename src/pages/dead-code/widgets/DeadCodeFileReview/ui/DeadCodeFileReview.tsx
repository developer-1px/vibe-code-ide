import { useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';
import { filesAtom, fullNodeMapAtom } from '@/entities/AppView/model/atoms';
import { getSelectedDeadCodeFilePaths, getSelectedDeadCodeLinesByFile } from '@/entities/DeadCode/lib/computed';
import { deadCodeResultsAtom, selectedDeadCodeItemsAtom } from '@/entities/DeadCode/model/atoms';
import { activeTabAtom } from '@/features/File/OpenFiles/model/atoms.ts';
import FileSection from '@/features/File/OpenFiles/ui/FileSection.tsx';
import { useScrollNavigation } from '@/shared/hooks/useScrollNavigation.ts';

export function DeadCodeFileReview() {
  const selectedItems = useAtomValue(selectedDeadCodeItemsAtom);
  const deadCodeResults = useAtomValue(deadCodeResultsAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const files = useAtomValue(filesAtom);
  const activeTab = useAtomValue(activeTabAtom);
  const displayFilePaths = useMemo(() => {
    if (!deadCodeResults || selectedItems.size === 0) {
      return [];
    }

    return getSelectedDeadCodeFilePaths(deadCodeResults, selectedItems);
  }, [selectedItems, deadCodeResults]);

  const highlightedLinesByFile = useMemo(() => {
    if (!deadCodeResults || selectedItems.size === 0) {
      return new Map<string, Set<number>>();
    }

    return getSelectedDeadCodeLinesByFile(deadCodeResults, selectedItems);
  }, [selectedItems, deadCodeResults]);

  const { registerSection, scrollToFile } = useScrollNavigation(displayFilePaths);

  useEffect(() => {
    if (activeTab && displayFilePaths.includes(activeTab)) {
      scrollToFile(activeTab);
    }
  }, [activeTab, scrollToFile, displayFilePaths]);

  if (displayFilePaths.length === 0) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-bg-elevated text-text-tertiary">
        <p className="text-sm">Select dead code items to view files here</p>
      </div>
    );
  }

  return (
    <div id="scroll-view-container" className="flex-1 min-h-0 h-full overflow-y-auto bg-bg-elevated">
      {displayFilePaths.map((filePath) => {
        const node = fullNodeMap.get(filePath);
        if (!node) return null;

        return (
          <FileSection
            key={filePath}
            ref={(el) => registerSection(filePath, el)}
            node={node}
            files={files}
            highlightedLines={highlightedLinesByFile.get(filePath) || new Set<number>()}
            deadCodeResults={deadCodeResults}
          />
        );
      })}
    </div>
  );
}
