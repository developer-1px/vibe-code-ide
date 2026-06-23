import type { RefObject } from 'react';
import type { CodeDocLayoutMode, DocData } from '../model/types';
import { DocViewer } from './DocViewer';

interface CodeDocReaderProps {
  docs: Array<{ filePath: string; docData: DocData }>;
  layoutMode: CodeDocLayoutMode;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export function CodeDocReader({ docs, layoutMode, scrollContainerRef }: CodeDocReaderProps) {
  return (
    <div
      ref={scrollContainerRef}
      className="absolute inset-0 min-h-0 flex items-start justify-center overflow-y-auto custom-scrollbar"
    >
      <div className="w-full max-w-7xl p-6 md:p-12">
        {docs.map(({ filePath, docData }, index) => (
          <div
            key={filePath}
            id={`doc-${filePath}`}
            className={`mx-auto min-h-[900px] transition-all duration-300 ${
              layoutMode === 'split' ? 'max-w-full' : 'max-w-4xl px-12 py-16'
            } ${index > 0 ? 'mt-12' : ''}`}
          >
            <DocViewer data={docData} layout={layoutMode} />
          </div>
        ))}
      </div>
    </div>
  );
}
