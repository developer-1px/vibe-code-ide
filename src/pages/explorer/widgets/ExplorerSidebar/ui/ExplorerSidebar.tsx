import { useAtom, useAtomValue } from 'jotai';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';
import { Sidebar } from '@/shared/ui/Sidebar';
import { FileExplorer } from '@/widgets/FileExplorer/FileExplorer.tsx';
import { RelatedFilesView } from '@/widgets/RelatedFilesView/RelatedFilesView.tsx';
import { fileTreeModeAtom, isSidebarOpenAtom } from '../model/atoms.ts';

export const ExplorerSidebar: React.FC = () => {
  const isSidebarOpen = useAtomValue(isSidebarOpenAtom);
  const [fileTreeMode, setFileTreeMode] = useAtom(fileTreeModeAtom);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFileExplorerCollapsed, setIsFileExplorerCollapsed] = useState(false);

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative focus:outline-none">
      <Sidebar resizable defaultWidth={250} minWidth={200} maxWidth={800} className="h-full shadow-2xl">
        <div className={!isFileExplorerCollapsed ? 'flex-1 flex flex-col overflow-hidden' : ''}>
          <button
            type="button"
            onClick={() => setIsFileExplorerCollapsed(!isFileExplorerCollapsed)}
            className="flex w-full h-8 items-center justify-between border-b border-border-DEFAULT px-2 flex-shrink-0 hover:bg-bg-deep transition-colors"
          >
            <span className="text-2xs font-medium text-text-tertiary normal-case">Project</span>
            {isFileExplorerCollapsed ? (
              <ChevronRight className="w-3 h-3 text-text-muted" />
            ) : (
              <ChevronDown className="w-3 h-3 text-text-muted" />
            )}
          </button>

          {!isFileExplorerCollapsed && (
            <>
              <div className="flex border-b border-border-DEFAULT">
                <button
                  type="button"
                  onClick={() => setFileTreeMode('all')}
                  className={`flex-1 px-2 py-1.5 text-2xs font-medium transition-colors ${
                    fileTreeMode === 'all'
                      ? 'bg-bg-deep text-text-primary border-b-2 border-warm-300'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  All Files
                </button>
                <button
                  type="button"
                  onClick={() => setFileTreeMode('related')}
                  className={`flex-1 px-2 py-1.5 text-2xs font-medium transition-colors ${
                    fileTreeMode === 'related'
                      ? 'bg-bg-deep text-text-primary border-b-2 border-warm-300'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  Related
                </button>
              </div>

              {fileTreeMode === 'all' ? (
                <FileExplorer containerRef={containerRef} />
              ) : (
                <RelatedFilesView containerRef={containerRef} />
              )}
            </>
          )}
        </div>
      </Sidebar>
    </div>
  );
};
