/**
 * File Tree Renderer - Recursive rendering logic for file tree
 */
import React from 'react';
import { Folder, FolderOpen } from 'lucide-react';
import { FileTreeItem } from '@/components/ide/FileTreeItem';
import type { FolderNode, FlatItem } from '../model/types';
import { getFileIcon } from '../lib/getFileIcon';

interface FileTreeRendererProps {
  fileTree: FolderNode[];
  collapsedFolders: Set<string>;
  flatItemList: FlatItem[];
  focusedIndex: number;
  activeTab: string | null;
  itemRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  onFocusChange: (index: number) => void;
  onFileClick: (filePath: string) => void;
  onToggleFolder: (path: string) => void;
}

export const FileTreeRenderer: React.FC<FileTreeRendererProps> = ({
  fileTree,
  collapsedFolders,
  flatItemList,
  focusedIndex,
  activeTab,
  itemRefs,
  onFocusChange,
  onFileClick,
  onToggleFolder,
}) => {
  const renderNode = (node: FolderNode, depth: number = 0): React.ReactNode => {
    const isCollapsed = collapsedFolders.has(node.path);

    if (node.type === 'file' && node.filePath) {
      const itemIndex = flatItemList.findIndex(
        (item) => item.type === 'file' && item.filePath === node.filePath
      );
      const isFocused = focusedIndex === itemIndex;
      const isActive = activeTab === node.filePath;

      // Extract file extension
      const fileExtension = node.name.includes('.')
        ? '.' + node.name.split('.').pop()
        : undefined;

      const FileIconComponent = getFileIcon(node.name);

      return (
        <FileTreeItem
          key={node.path}
          ref={(el) => {
            if (el && itemIndex >= 0) {
              itemRefs.current.set(itemIndex, el);
            }
          }}
          icon={FileIconComponent}
          label={node.name}
          active={isActive}
          focused={isFocused}
          indent={depth}
          fileExtension={fileExtension}
          onFocus={() => {
            if (itemIndex >= 0) onFocusChange(itemIndex);
          }}
          onDoubleClick={() => {
            if (node.filePath) onFileClick(node.filePath);
          }}
        />
      );
    }

    if (node.type === 'folder') {
      const itemIndex = flatItemList.findIndex(
        (item) => item.type === 'folder' && item.path === node.path
      );
      const isFocused = focusedIndex === itemIndex;
      const isOpen = !isCollapsed;
      const FolderIconComponent = isOpen ? FolderOpen : Folder;

      return (
        <React.Fragment key={node.path}>
          <FileTreeItem
            ref={(el) => {
              if (el && itemIndex >= 0) {
                itemRefs.current.set(itemIndex, el);
              }
            }}
            icon={FolderIconComponent}
            label={node.name}
            isFolder
            isOpen={isOpen}
            focused={isFocused}
            indent={depth}
            onFocus={() => {
              if (itemIndex >= 0) onFocusChange(itemIndex);
            }}
            onDoubleClick={() => {
              onToggleFolder(node.path);
            }}
          />
          {isOpen && node.children && (
            <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
          )}
        </React.Fragment>
      );
    }

    return null;
  };

  return <div>{fileTree.map((node) => renderNode(node, 0))}</div>;
};
