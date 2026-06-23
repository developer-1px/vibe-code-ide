import { useAtom, useAtomValue } from 'jotai';
import { useState } from 'react';
import { fileTreeModeAtom, isSidebarOpenAtom } from '@/features/Explorer/model/atoms';
import { Sidebar } from '@/shared/ui/Sidebar';
import { ExplorerSectionHeader } from '../../../features/ExplorerSidebar/ui/ExplorerSectionHeader';
import { FileTreeModeTabs } from '../../../features/ExplorerSidebar/ui/FileTreeModeTabs';
import { FileExplorer } from '../../../features/FileExplorer/ui/FileExplorer';
import { RelatedFilesView } from '../../../features/RelatedFiles/ui/RelatedFilesView';

export function ExplorerSidebar() {
  const isSidebarOpen = useAtomValue(isSidebarOpenAtom);
  const [fileTreeMode, setFileTreeMode] = useAtom(fileTreeModeAtom);
  const [isFileExplorerCollapsed, setIsFileExplorerCollapsed] = useState(false);

  if (!isSidebarOpen) {
    return null;
  }

  function handleFileExplorerCollapsedToggle() {
    setIsFileExplorerCollapsed(!isFileExplorerCollapsed);
  }

  return (
    <div className="relative focus:outline-none">
      <Sidebar resizable defaultWidth={250} minWidth={200} maxWidth={800} className="h-full shadow-2xl">
        <div className={!isFileExplorerCollapsed ? 'flex-1 min-h-0 flex flex-col overflow-hidden' : ''}>
          <ExplorerSectionHeader
            isCollapsed={isFileExplorerCollapsed}
            toggleCollapsed={handleFileExplorerCollapsedToggle}
          />

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
}
