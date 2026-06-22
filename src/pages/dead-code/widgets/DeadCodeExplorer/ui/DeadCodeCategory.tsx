/**
 * DeadCodeCategory - Category section with collapsible tree
 * Renders each dead code item as individual node
 */

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { activeActivityPageIdAtom } from '@/app/model/activityPageAtoms';
import { filesAtom, viewModeAtom } from '@/entities/AppView/model/atoms';
import { buildDeadCodeTree } from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/lib/buildDeadCodeTree.ts';
import { renderCategoryIcon } from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/lib/categoryUtils.tsx';
import type { DeadCodeItem } from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/lib/deadCodeAnalyzer.ts';
import {
  collapsedFoldersAtom,
  expandedCategoriesAtom,
} from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/model/atoms.ts';
import type { CategoryKey } from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/model/types.ts';
import { useDeadCodeSelection } from '@/features/Code/CodeAnalyzer/DeadCodeSelection/lib/useDeadCodeSelection.ts';
import { CategoryCheckbox } from '@/features/Code/CodeAnalyzer/DeadCodeSelection/ui/CategoryCheckbox.tsx';
import { targetLineAtom } from '@/features/File/Navigation/model/atoms.ts';
import { useOpenFile } from '@/features/File/OpenFiles/lib/useOpenFile.ts';
import { Checkbox } from '@/shared/ui/Checkbox';
import { FileIcon } from '@/shared/ui/FileIcon';
import { FileTreeItem } from '@/shared/ui/FileTreeItem';
import { TreeView } from '@/shared/ui/TreeView/TreeView.tsx';
import { DeadCodeFolderItem } from './DeadCodeFolderItem.tsx';

interface DeadCodeCategoryItemProps {
  item: DeadCodeItem;
  depth: number;
  focused: boolean;
  itemRef: React.Ref<HTMLDivElement>;
  fileContent: string;
  isSelected: boolean;
  onFocus: () => void;
  onOpenItem: (item: DeadCodeItem) => void;
  onToggleItemSelection: (item: DeadCodeItem) => void;
}

function DeadCodeCategoryItem({
  item,
  depth,
  focused,
  itemRef,
  fileContent,
  isSelected,
  onFocus,
  onOpenItem,
  onToggleItemSelection,
}: DeadCodeCategoryItemProps) {
  const fileName = item.filePath.split('/').pop() || item.filePath;
  const displayLabel = `${fileName}:${item.line}`;
  const lines = fileContent.split('\n');
  const fullLine = lines[item.line - 1] || '';
  let codeSnippet = fullLine.trim();

  if (item.kind === 'import') {
    const importMatch = fullLine.match(/import\s+(?:type\s+)?(\{[^}]+\}|\w+)/);
    if (importMatch) {
      codeSnippet = importMatch[1].trim();
    }
  }

  function handleFocus() {
    onFocus();
  }

  function handleDoubleClick() {
    onOpenItem(item);
  }

  function handleCheckedChange() {
    onToggleItemSelection(item);
  }

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div
      ref={itemRef}
      className={`flex items-center gap-2 cursor-pointer ${focused ? 'bg-white/8 border-l-2 border-warm-300/50' : ''}`}
      onClick={handleFocus}
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <FileTreeItem
          icon={(() => <FileIcon fileName={item.filePath} />) as React.ComponentType}
          label={displayLabel}
          focused={false}
          indent={depth}
          onFocus={handleFocus}
          onDoubleClick={handleDoubleClick}
        />
        {codeSnippet && <span className="text-2xs text-text-tertiary truncate flex-1 font-mono">{codeSnippet}</span>}
      </div>
      <Checkbox
        checked={isSelected}
        onCheckedChange={handleCheckedChange}
        className="shrink-0 mr-2 border-border-hover"
        onClick={handleCheckboxClick}
      />
    </div>
  );
}

export function DeadCodeCategory({
  title,
  items,
  categoryKey,
  startIndex: _startIndex,
  itemRefs,
}: {
  title: string;
  items: DeadCodeItem[];
  categoryKey: CategoryKey;
  startIndex: number;
  itemRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
}) {
  const [expandedCategories, setExpandedCategories] = useAtom(expandedCategoriesAtom);
  const [collapsedFolders, setCollapsedFolders] = useAtom(collapsedFoldersAtom);
  const files = useAtomValue(filesAtom);
  const setTargetLine = useSetAtom(targetLineAtom);
  const setViewMode = useSetAtom(viewModeAtom);
  const setActiveActivityPageId = useSetAtom(activeActivityPageIdAtom);
  const { openFile } = useOpenFile();
  const { toggleItemSelection, isItemSelected } = useDeadCodeSelection();

  const isExpanded = expandedCategories[categoryKey];

  function handleItemClick(item: DeadCodeItem) {
    openFile(item.filePath);
    setTargetLine({ nodeId: item.filePath, lineNum: item.line });
    setActiveActivityPageId('explorer');
    setViewMode('ide');
  }

  function handleToggleCategory() {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  }

  function handleToggleFolder(folderPath: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  }

  function handleToggleItemSelection(item: DeadCodeItem) {
    toggleItemSelection(item);
  }

  const tree = useMemo(() => buildDeadCodeTree(items), [items]);

  return (
    <div className="rounded overflow-hidden">
      {/* Category Header */}
      <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 transition-colors border-b border-border-DEFAULT">
        <button onClick={handleToggleCategory} className="flex items-center gap-1.5 flex-1">
          {isExpanded ? (
            <ChevronDown size={14} className="text-text-muted shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-text-muted shrink-0" />
          )}
          {renderCategoryIcon(categoryKey)}
          <span className="text-xs text-text-primary font-medium">{title}</span>
          <span className="text-xs text-text-muted">({items.length})</span>
        </button>

        <CategoryCheckbox items={items} />
      </div>

      {/* Category Items - Tree View */}
      {isExpanded && items.length > 0 && (
        <div className="mt-0.5">
          <TreeView
            data={tree}
            getNodeType={(node) => node.type}
            getNodePath={(node) => node.path}
            collapsedPaths={collapsedFolders}
            onToggleCollapse={handleToggleFolder}
          >
            {({ node, depth, isFocused, isCollapsed, itemRef, handleFocus, handleToggle }) => {
              // Folder rendering
              if (node.type === 'folder') {
                return (
                  <DeadCodeFolderItem
                    ref={itemRef}
                    name={node.name}
                    depth={depth}
                    isCollapsed={isCollapsed}
                    focused={isFocused}
                    globalItemIndex={0}
                    itemRefs={itemRefs}
                    onFocus={handleFocus}
                    onDoubleClick={handleToggle}
                  />
                );
              }

              // Dead code item rendering (each line is individual node)
              if (node.type === 'dead-code-item' && node.deadCodeItem) {
                const item = node.deadCodeItem;
                const isSelected = isItemSelected(item);

                const fileContent = files[item.filePath] || '';

                return (
                  <DeadCodeCategoryItem
                    key={node.path}
                    item={item}
                    depth={depth}
                    focused={isFocused}
                    itemRef={itemRef}
                    fileContent={fileContent}
                    isSelected={isSelected}
                    onFocus={handleFocus}
                    onOpenItem={handleItemClick}
                    onToggleItemSelection={handleToggleItemSelection}
                  />
                );
              }

              return null;
            }}
          </TreeView>
        </div>
      )}

      {isExpanded && items.length === 0 && (
        <div className="px-4 py-3 text-xs text-text-muted text-center">No issues found</div>
      )}
    </div>
  );
}
