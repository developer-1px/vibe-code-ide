import type { RefObject } from 'react';
import type { CodeDocLayoutMode, DocData } from '../../../features/CodeDocReader/model/types';
import { CodeDocReader as CodeDocReaderContent } from '../../../features/CodeDocReader/ui/CodeDocReader';

interface CodeDocReaderProps {
  docs: Array<{ filePath: string; docData: DocData }>;
  layoutMode: CodeDocLayoutMode;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export function CodeDocReader({ docs, layoutMode, scrollContainerRef }: CodeDocReaderProps) {
  return <CodeDocReaderContent docs={docs} layoutMode={layoutMode} scrollContainerRef={scrollContainerRef} />;
}
