import type { Dispatch, RefObject, SetStateAction } from 'react';
import { CodeDocLayoutModeButton } from '../../../features/CodeDocLayoutMode/ui/CodeDocLayoutModeButton';
import type { CodeDocLayoutMode, DocData } from '../../../features/CodeDocReader/model/types';
import { CodeDocReader } from '../../../features/CodeDocReader/ui/CodeDocReader';

interface CodeDocReaderPanelProps {
  docs: Array<{ filePath: string; docData: DocData }>;
  layoutMode: CodeDocLayoutMode;
  changeLayoutMode: Dispatch<SetStateAction<CodeDocLayoutMode>>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export function CodeDocReaderPanel({
  docs,
  layoutMode,
  changeLayoutMode,
  scrollContainerRef,
}: CodeDocReaderPanelProps) {
  return (
    <div className="absolute inset-0 min-h-0 bg-gray-50 overflow-hidden">
      <div className="absolute top-6 right-8 z-50 print:hidden">
        <CodeDocLayoutModeButton layoutMode={layoutMode} changeLayoutMode={changeLayoutMode} />
      </div>

      <CodeDocReader docs={docs} layoutMode={layoutMode} scrollContainerRef={scrollContainerRef} />
    </div>
  );
}
