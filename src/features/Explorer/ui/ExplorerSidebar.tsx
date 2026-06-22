import { useAtom, useAtomValue } from 'jotai';
import type React from 'react';
import { useState } from 'react';
import { fileTreeModeAtom, isSidebarOpenAtom } from '@/features/Explorer/model/atoms';
import { FileExplorer } from '@/features/Explorer/ui/FileExplorer';
import { Sidebar } from '@/shared/ui/Sidebar';
import { ExplorerSectionHeader } from './ExplorerSectionHeader';
import { FileTreeModeTabs } from './FileTreeModeTabs';
import { RelatedFilesView } from './RelatedFilesView';

export const ExplorerSidebar: React.FC = () => {
  const isSidebarOpen = useAtomValue(isSidebarOpenAtom);
  const [fileTreeMode, setFileTreeMode] = useAtom(fileTreeModeAtom);
  const [isFileExplorerCollapsed, setIsFileExplorerCollapsed] = useState(false);

  if (!isSidebarOpen) {
    return null;
  }

  function toggleFileExplorerCollapsed() {
    setIsFileExplorerCollapsed(!isFileExplorerCollapsed);
  }

  return (
    <div className="relative focus:outline-none">
      <Sidebar resizable defaultWidth={250} minWidth={200} maxWidth={800} className="h-full shadow-2xl">
        <div className={!isFileExplorerCollapsed ? 'flex-1 min-h-0 flex flex-col overflow-hidden' : ''}>
          <ExplorerSectionHeader isCollapsed={isFileExplorerCollapsed} toggleCollapsed={toggleFileExplorerCollapsed} />

          {!isFileExplorerCollapsed && (
            <>
              <FileTreeModeTabs fileTreeMode={fileTreeMode} changeFileTreeMode={setFileTreeMode} />

              {fileTreeMode === 'all' ? <FileExplorer /> : <RelatedFilesView />}
            </>
          )}
        </div>
      </Sidebar>
    </div>
  );
};
