import { useAtomValue } from 'jotai';
import { FileText } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fullNodeMapAtom } from '@/entities/AppView/model/atoms';
import { activeTabAtom, openedTabsAtom } from '@/features/File/OpenFiles/model/atoms';
import { convertToDocData } from './features/CodeDocReader/lib/tsAdapter';
import type { CodeDocLayoutMode, DocData } from './features/CodeDocReader/model/types';
import { CodeDocReaderPanel } from './widgets/CodeDocReader/ui/CodeDocReaderPanel';

export function PageCodeDoc() {
  const openedTabs = useAtomValue(openedTabsAtom);
  const activeTab = useAtomValue(activeTabAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const [layoutMode, setLayoutMode] = useState<CodeDocLayoutMode>('linear');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const allDocData: Array<{ filePath: string; docData: DocData }> = useMemo(() => {
    return openedTabs
      .map((filePath) => {
        const node = fullNodeMap.get(filePath);
        if (!node) return null;

        try {
          return { filePath, docData: convertToDocData(node) };
        } catch (error) {
          console.error(`Failed to convert ${filePath} to DocData:`, error);
          return null;
        }
      })
      .filter((item): item is { filePath: string; docData: DocData } => item !== null);
  }, [openedTabs, fullNodeMap]);

  useEffect(() => {
    if (activeTab && scrollContainerRef.current) {
      const targetElement = document.getElementById(`doc-${activeTab}`);
      targetElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab]);

  if (allDocData.length === 0) {
    return (
      <div className="h-full min-h-0 w-full min-w-0 relative overflow-hidden">
        <div className="flex-1 h-full flex items-center justify-center bg-bg-elevated text-text-tertiary">
          <div className="text-center">
            <FileText size={40} className="mx-auto mb-4 text-gray-300" aria-hidden="true" />
            <p className="text-sm">No files open. Use search (Shift+Shift) or click a file in the sidebar to open.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 w-full min-w-0 relative overflow-hidden">
      <CodeDocReaderPanel
        docs={allDocData}
        layoutMode={layoutMode}
        changeLayoutMode={setLayoutMode}
        scrollContainerRef={scrollContainerRef}
      />
    </div>
  );
}
