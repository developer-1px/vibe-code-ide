/**
 * Dead Code Tree Renderer - FileTreeRenderer를 확장하여 dead code 항목 표시
 */
import React from 'react';
import { Folder, FolderOpen, AlertTriangle } from 'lucide-react';
import { FileTreeItem } from '@/components/ide/FileTreeItem';
import type { FolderNode } from '../../AppSidebar/model/types';
import type { DeadCodeItem } from '../../../shared/deadCodeAnalyzer';
import { getFileIcon } from '../../AppSidebar/lib/getFileIcon';
import { Checkbox } from '@/components/ui/Checkbox';

interface DeadCodeTreeRendererProps {
  fileTree: FolderNode[];
  collapsedFolders: Set<string>;
  deadCodeItems: DeadCodeItem[];
  selectedItems: Set<string>;
  flatItemList: any[];
  focusedIndex: number;
  itemRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  onFileClick: (filePath: string, line: number) => void;
  onFocusChange: (index: number) => void;
  onToggleFolder: (path: string) => void;
  onToggleSelection: (item: DeadCodeItem) => void;
  getItemKey: (item: DeadCodeItem) => string;
}

export const DeadCodeTreeRenderer: React.FC<DeadCodeTreeRendererProps> = ({
  fileTree,
  collapsedFolders,
  deadCodeItems,
  selectedItems,
  flatItemList,
  focusedIndex,
  itemRefs,
  onFileClick,
  onFocusChange,
  onToggleFolder,
  onToggleSelection,
  getItemKey,
}) => {
  // Group dead code items by file path
  const itemsByFile = React.useMemo(() => {
    const map = new Map<string, DeadCodeItem[]>();
    deadCodeItems.forEach(item => {
      const existing = map.get(item.filePath) || [];
      existing.push(item);
      map.set(item.filePath, existing);
    });
    return map;
  }, [deadCodeItems]);

  const renderNode = (node: FolderNode, depth: number = 0): React.ReactNode => {
    const isCollapsed = collapsedFolders.has(node.path);

    if (node.type === 'file' && node.filePath) {
      const items = itemsByFile.get(node.filePath) || [];
      const FileIconComponent = getFileIcon(node.name);
      const fileExtension = node.name.includes('.')
        ? '.' + node.name.split('.').pop()
        : undefined;

      return (
        <div key={node.path}>
          {items.map((item, idx) => {
            const isSelected = selectedItems.has(getItemKey(item));

            // Find index in flat list for this dead code item
            const itemKey = `${item.filePath}:${item.line}:${item.symbolName}`;
            const itemIndex = flatItemList.findIndex(
              (flatItem) => flatItem.type === 'dead-code-item' && flatItem.path === itemKey
            );
            const isFocused = focusedIndex === itemIndex;

            return (
              <div
                key={idx}
                className="flex items-center gap-2"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(item)}
                  className="shrink-0 ml-2"
                  onClick={(e) => e.stopPropagation()}
                />

                <div className="flex-1 min-w-0">
                  <FileTreeItem
                    ref={(el) => {
                      if (el && itemIndex >= 0) {
                        itemRefs.current.set(itemIndex, el);
                      }
                    }}
                    icon={FileIconComponent}
                    label={`${node.name}:${item.line} - ${item.symbolName}`}
                    active={false}
                    focused={isFocused}
                    indent={depth}
                    fileExtension={fileExtension}
                    onFocus={() => {
                      if (itemIndex >= 0) onFocusChange(itemIndex);
                    }}
                    onDoubleClick={() => onFileClick(item.filePath, item.line)}
                  />
                </div>

                {item.from && (
                  <span className="text-2xs text-text-tertiary truncate max-w-[150px] mr-2">
                    from "{item.from}"
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (node.type === 'folder') {
      const isOpen = !isCollapsed;
      const FolderIconComponent = isOpen ? FolderOpen : Folder;

      // Find index in flat list
      const itemIndex = flatItemList.findIndex(
        (item) => item.type === 'folder' && item.path === node.path
      );
      const isFocused = focusedIndex === itemIndex;

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
            onDoubleClick={() => onToggleFolder(node.path)}
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
