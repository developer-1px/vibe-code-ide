/**
 * FileExplorer - File tree navigation component
 * Handles file tree display, keyboard navigation, and file opening
 */

import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { filesAtom, focusedFolderAtom } from '@/entities/AppView/model/atoms';
import { useOpenFile } from '@/features/File/OpenFiles/lib/useOpenFile';
import { activeTabAtom, openedTabsAtom } from '@/features/File/OpenFiles/model/atoms';
import { useTreeKeyboardNavigation } from '@/shared/hooks/useTreeKeyboardNavigation';
import { TreeView } from '@/shared/ui/TreeView/TreeView';
import { buildFileTree } from '../../../entities/FileTree/lib/buildFileTree';
import { getFlatItemList } from '../../../entities/FileTree/lib/getFlatItemList';
import { getInitialCollapsedFolders } from '../../../entities/FileTree/lib/getInitialCollapsedFolders';
import type { FlatItem, FolderNode } from '../../../entities/FileTree/model/types';
import { FileExplorerTreeItem } from './FileExplorerTreeItem';
import { FolderBreadcrumb } from './FolderBreadcrumb';

interface FileExplorerProps {
  filteredFiles?: Record<string, string>;
}

export function FileExplorer({ filteredFiles }: FileExplorerProps) {
  const files = useAtomValue(filesAtom);
  const activeTab = useAtomValue(activeTabAtom);
  const openedTabs = useAtomValue(openedTabsAtom);
  const { openFile } = useOpenFile();
  const [focusedFolder, setFocusedFolder] = useAtom(focusedFolderAtom);

  // Use filtered files if provided, otherwise use all files
  const displayFiles = filteredFiles || files;

  // Collapsed folders state - initial: root level open, others collapsed
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(() => getInitialCollapsedFolders(displayFiles));

  // Build file tree from flat file list (with Folder Focus Mode support)
  const fileTree = useMemo(() => buildFileTree(displayFiles, focusedFolder), [displayFiles, focusedFolder]);

  // Flat list of all visible items for keyboard navigation
  const flatItemList = useMemo(() => getFlatItemList(fileTree, collapsedFolders), [fileTree, collapsedFolders]);

  function toggleFolder(path: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function openFilePath(filePath: string) {
    openFile(filePath);
  }

  // Folder Focus Mode commands
  function focusFolder(folderPath: string) {
    setFocusedFolder(folderPath);
  }

  function exitFolderFocus() {
    setFocusedFolder(null);
  }

  function activateItem(item: FlatItem) {
    if (item.filePath) {
      openFilePath(item.filePath);
    }
  }

  function changeFocusedIndex(nextFocusedIndex: number) {
    setFocusedIndex(nextFocusedIndex);
  }

  // Keyboard navigation with custom hook
  const { focusedIndex, setFocusedIndex, itemRefs } = useTreeKeyboardNavigation<FlatItem>({
    flatItemList,
    collapsedFolders,
    onToggleFolder: toggleFolder,
    onItemAction: activateItem,
    onFolderFocus: focusFolder,
    onExitFocus: exitFolderFocus,
    scope: 'sidebar',
    enabled: true,
  });

  // Reset focusedIndex when focusedFolder changes
  useEffect(() => {
    setFocusedIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFocusedIndex]);

  if (fileTree.length === 0) {
    return <div className="px-3 py-6 text-xs text-text-secondary text-center">No files</div>;
  }

  return (
    <>
      {/* Folder Focus Mode Breadcrumb */}
      {focusedFolder && <FolderBreadcrumb focusedFolder={focusedFolder} />}

      <TreeView<FolderNode>
        className="flex-1 min-h-0 overflow-y-auto py-1"
        data={fileTree}
        getNodeType={(node) => node.type}
        getNodePath={(node) => node.path}
        collapsedPaths={collapsedFolders}
        toggleCollapse={toggleFolder}
        focusedIndex={focusedIndex}
        changeFocus={changeFocusedIndex}
        itemRefs={itemRefs}
      >
        {({ node, depth, isFocused, isCollapsed, itemRef, handleFocus, handleToggle }) => {
          return (
            <FileExplorerTreeItem
              node={node}
              depth={depth}
              isFocused={isFocused}
              isCollapsed={isCollapsed}
              itemRef={itemRef}
              activeTab={activeTab}
              openedTabs={openedTabs}
              focusItem={handleFocus}
              toggleFolder={handleToggle}
              openFile={openFilePath}
            />
          );
        }}
      </TreeView>
    </>
  );
}
