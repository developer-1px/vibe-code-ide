import { Folder, FolderOpen } from 'lucide-react';
import type React from 'react';
import { FileIcon } from '@/shared/ui/FileIcon';
import { FileTreeItem } from '@/shared/ui/FileTreeItem';
import type { FolderNode } from '../../../entities/FileTree/model/types';

interface FileExplorerTreeItemProps {
  node: FolderNode;
  depth: number;
  isFocused: boolean;
  isCollapsed: boolean;
  itemRef: React.Ref<HTMLDivElement>;
  activeTab: string | null;
  openedTabs: string[];
  focusItem: () => void;
  toggleFolder: () => void;
  openFile: (filePath: string) => void;
}

export function FileExplorerTreeItem({
  node,
  depth,
  isFocused,
  isCollapsed,
  itemRef,
  activeTab,
  openedTabs,
  focusItem,
  toggleFolder,
  openFile,
}: FileExplorerTreeItemProps) {
  const isActive = activeTab === node.filePath;
  const isOpened = node.filePath ? openedTabs.includes(node.filePath) : false;
  const fileExtension = node.name.includes('.') ? `.${node.name.split('.').pop()}` : undefined;
  const icon =
    node.type === 'folder'
      ? isCollapsed
        ? Folder
        : FolderOpen
      : ((() => <FileIcon fileName={node.name} />) as React.ComponentType);

  function handleDoubleClick() {
    if (node.type === 'file' && node.filePath) {
      openFile(node.filePath);
    } else {
      toggleFolder();
    }
  }

  function handleFocus() {
    focusItem();
  }

  return (
    <FileTreeItem
      ref={itemRef}
      icon={icon}
      label={node.name}
      active={isActive}
      opened={isOpened}
      focused={isFocused}
      isFolder={node.type === 'folder'}
      isOpen={!isCollapsed}
      indent={depth}
      fileExtension={fileExtension}
      onFocus={handleFocus}
      onDoubleClick={handleDoubleClick}
    />
  );
}
