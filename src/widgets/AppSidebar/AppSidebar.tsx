/**
 * AppSidebar - File Explorer with LIMN Design System
 * Coordinates file tree display and keyboard navigation
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { Sidebar } from '@/components/ide/Sidebar';
import { filesAtom, isSidebarOpenAtom, activeTabAtom } from '../../store/atoms';
import { useOpenFile } from '../../features/Files/lib/useOpenFile';
import UploadFolderButton from '../../features/UploadFolderButton';
import { getInitialCollapsedFolders } from './lib/getInitialCollapsedFolders';
import { buildFileTree } from './lib/buildFileTree';
import { getFlatItemList } from './lib/getFlatItemList';
import { FileTreeRenderer } from './ui/FileTreeRenderer';
import { useTreeKeyboardNavigation } from '../../shared/hooks/useTreeKeyboardNavigation';

export const AppSidebar: React.FC = () => {
  const files = useAtomValue(filesAtom);
  const isSidebarOpen = useAtomValue(isSidebarOpenAtom);
  const activeTab = useAtomValue(activeTabAtom);
  const { openFile } = useOpenFile();

  // Collapsed folders state - initial: root level open, others collapsed
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(() =>
    getInitialCollapsedFolders(files)
  );

  // Build file tree from flat file list
  const fileTree = useMemo(() => buildFileTree(files), [files]);

  // Flat list of all visible items for keyboard navigation
  const flatItemList = useMemo(
    () => getFlatItemList(fileTree, collapsedFolders),
    [fileTree, collapsedFolders]
  );

  const toggleFolder = useCallback((path: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleFileClick = useCallback(
    (filePath: string) => {
      openFile(filePath);
    },
    [openFile]
  );

  // Keyboard navigation with custom hook
  const { focusedIndex, setFocusedIndex, itemRefs, containerRef } =
    useTreeKeyboardNavigation({
      flatItemList,
      collapsedFolders,
      onToggleFolder: toggleFolder,
      onItemAction: (item) => {
        if (item.filePath) {
          handleFileClick(item.filePath);
        }
      },
    });

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <div ref={containerRef} tabIndex={-1} className="relative focus:outline-none">
      <Sidebar
        resizable
        defaultWidth={300}
        minWidth={250}
        maxWidth={800}
        className="h-full shadow-2xl"
      >
        <Sidebar.Header>
          <span className="label text-2xs">PROJECT</span>
          <UploadFolderButton />
        </Sidebar.Header>

        {fileTree.length > 0 ? (
          <FileTreeRenderer
            fileTree={fileTree}
            collapsedFolders={collapsedFolders}
            flatItemList={flatItemList}
            focusedIndex={focusedIndex}
            activeTab={activeTab}
            itemRefs={itemRefs}
            onFocusChange={setFocusedIndex}
            onFileClick={handleFileClick}
            onToggleFolder={toggleFolder}
          />
        ) : (
          <div className="px-3 py-6 text-xs text-text-secondary text-center">No files</div>
        )}
      </Sidebar>
    </div>
  );
};

export default AppSidebar;
