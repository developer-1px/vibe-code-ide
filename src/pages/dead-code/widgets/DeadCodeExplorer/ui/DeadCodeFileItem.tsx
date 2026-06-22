/**
 * DeadCodeFileItem - Dead code items rendering for a file
 */

import { useSetAtom } from 'jotai';
import React from 'react';
import { activeActivityPageIdAtom } from '@/app/model/activityPageAtoms';
import { viewModeAtom } from '@/entities/AppView/model/atoms';
import { FileIcon } from '@/entities/SourceFileNode/ui/FileIcon.tsx';
import type { DeadCodeItem } from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/lib/deadCodeAnalyzer.ts';
import { useDeadCodeSelection } from '@/features/Code/CodeAnalyzer/DeadCodeSelection/lib/useDeadCodeSelection.ts';
import { targetLineAtom } from '@/features/File/Navigation/model/atoms.ts';
import { useOpenFile } from '@/features/File/OpenFiles/lib/useOpenFile.ts';
import { Checkbox } from '@/shared/ui/Checkbox';
import { FileTreeItem } from '@/shared/ui/FileTreeItem';

interface DeadCodeFileItemRowProps {
  item: DeadCodeItem;
  itemIndex: number;
  deadCodeGlobalIndex: number;
  fileName: string;
  fileExtension?: string;
  depth: number;
  focused?: boolean;
  itemRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  forwardedRef: React.ForwardedRef<HTMLDivElement>;
  isSelected: boolean;
  onFocus?: () => void;
  onOpenItem: (item: DeadCodeItem) => void;
  onToggleItemSelection: (item: DeadCodeItem) => void;
}

function DeadCodeFileItemRow({
  item,
  itemIndex,
  deadCodeGlobalIndex,
  fileName,
  fileExtension,
  depth,
  focused,
  itemRefs,
  forwardedRef,
  isSelected,
  onFocus,
  onOpenItem,
  onToggleItemSelection,
}: DeadCodeFileItemRowProps) {
  function handleTreeItemRef(el: HTMLDivElement | null) {
    // Only attach TreeView ref to first item
    if (itemIndex === 0) {
      if (typeof forwardedRef === 'function') {
        forwardedRef(el);
      } else if (forwardedRef) {
        forwardedRef.current = el;
      }
    }
    if (el) {
      itemRefs.current.set(deadCodeGlobalIndex, el);
    }
  }

  function handleFocus() {
    onFocus?.();
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
    <div className="flex items-center gap-1">
      <div className="flex-1 min-w-0">
        <FileTreeItem
          ref={handleTreeItemRef}
          icon={(() => <FileIcon fileName={fileName} />) as React.ComponentType}
          label={`${fileName}:${item.line} - ${item.symbolName}`}
          focused={focused}
          indent={depth}
          fileExtension={fileExtension}
          onFocus={handleFocus}
          onDoubleClick={handleDoubleClick}
        />
      </div>
      {item.from && <span className="text-2xs text-text-tertiary truncate max-w-[150px] mr-2">from "{item.from}"</span>}
      <Checkbox
        checked={isSelected}
        onCheckedChange={handleCheckedChange}
        className="shrink-0 mr-2 border-border-hover"
        onClick={handleCheckboxClick}
      />
    </div>
  );
}

export const DeadCodeFileItem = React.forwardRef<
  HTMLDivElement,
  {
    items: DeadCodeItem[];
    fileName: string;
    depth: number;
    focused?: boolean;
    globalItemIndex: number;
    itemRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
    onFocus?: () => void;
  }
>((props, ref) => {
  const { items, fileName, depth, focused, globalItemIndex, itemRefs, onFocus } = props;
  const setTargetLine = useSetAtom(targetLineAtom);
  const setViewMode = useSetAtom(viewModeAtom);
  const setActiveActivityPageId = useSetAtom(activeActivityPageIdAtom);
  const { openFile } = useOpenFile();
  const { toggleItemSelection, isItemSelected } = useDeadCodeSelection();

  const fileExtension = fileName.includes('.') ? `.${fileName.split('.').pop()}` : undefined;

  function handleItemClick(item: DeadCodeItem) {
    openFile(item.filePath);
    setTargetLine({ nodeId: item.filePath, lineNum: item.line });
    setActiveActivityPageId('explorer');
    setViewMode('ide');
  }

  function handleFocus() {
    onFocus?.();
  }

  function handleToggleItemSelection(item: DeadCodeItem) {
    toggleItemSelection(item);
  }

  return (
    <div>
      {items.map((item, idx) => {
        const deadCodeGlobalIndex = globalItemIndex + idx;
        const itemFocused = idx === 0 ? focused : false; // Only first item gets TreeView focus
        const isSelected = isItemSelected(item);

        return (
          <DeadCodeFileItemRow
            key={`${item.filePath}:${item.line}:${item.symbolName}`}
            item={item}
            itemIndex={idx}
            deadCodeGlobalIndex={deadCodeGlobalIndex}
            fileName={fileName}
            fileExtension={fileExtension}
            depth={depth}
            focused={itemFocused}
            itemRefs={itemRefs}
            forwardedRef={ref}
            isSelected={isSelected}
            onFocus={idx === 0 ? handleFocus : undefined}
            onOpenItem={handleItemClick}
            onToggleItemSelection={handleToggleItemSelection}
          />
        );
      })}
    </div>
  );
});
