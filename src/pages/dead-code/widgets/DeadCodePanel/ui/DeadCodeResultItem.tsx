/**
 * DeadCodeResultItem - Individual dead code result item
 * Layout: [icon] symbolName ← | → fileName:lineNo [checkbox]
 */

import { useSetAtom } from 'jotai';
import { Code2, Component, FileBox, FunctionSquare, Import, Variable } from 'lucide-react';
import React from 'react';
import { activeActivityPageIdAtom } from '@/app/model/activityPageAtoms';
import { viewModeAtom } from '@/entities/AppView/model/atoms';
import { targetLineAtom } from '@/features/File/Navigation/model/atoms.ts';
import { useOpenFile } from '@/features/File/OpenFiles/lib/useOpenFile.ts';
import type { DeadCodeItem } from '@/pages/shared/features/DeadCode/lib/deadCodeAnalyzer.ts';
import { DeadCodeResultCheckbox } from './DeadCodeResultCheckbox.tsx';

// Get icon for dead code kind
function getKindIcon(kind: DeadCodeItem['kind']) {
  switch (kind) {
    case 'import':
      return Import;
    case 'export':
      return FileBox;
    case 'function':
      return FunctionSquare;
    case 'variable':
      return Variable;
    case 'prop':
      return Component;
    case 'argument':
      return Code2;
    default:
      return FileBox;
  }
}

export const DeadCodeResultItem = React.forwardRef<
  HTMLDivElement,
  {
    item: DeadCodeItem;
    depth: number;
    focused?: boolean;
    onFocus?: () => void;
  }
>((props, ref) => {
  const { item, depth: _depth, focused, onFocus } = props;
  const setTargetLine = useSetAtom(targetLineAtom);
  const setViewMode = useSetAtom(viewModeAtom);
  const setActiveActivityPageId = useSetAtom(activeActivityPageIdAtom);
  const { openFile } = useOpenFile();

  const fileName = item.filePath.split('/').pop() || item.filePath;
  const KindIcon = getKindIcon(item.kind);

  function handleItemClick() {
    openFile(item.filePath);
    setTargetLine({ nodeId: item.filePath, lineNum: item.line });
    setActiveActivityPageId('explorer');
    setViewMode('ide');
  }

  function handleFocus() {
    onFocus?.();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleItemClick();
    }
  }

  return (
    <div
      ref={ref}
      className={`flex items-center justify-between gap-2 cursor-pointer py-0.5 px-2 ${
        focused ? 'bg-white/8 border-l-2 border-warm-300/50' : ''
      }`}
      onClick={handleFocus}
      onDoubleClick={handleItemClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {/* Left side: Icon + Symbol name */}
      <div className="flex items-center gap-2 min-w-0">
        <KindIcon size={12} className="text-text-muted shrink-0" />
        <span className="text-2xs text-text-primary font-medium truncate">
          {item.symbolName}
          {item.componentName && <span className="text-text-tertiary ml-1">(in {item.componentName})</span>}
          {item.functionName && <span className="text-text-tertiary ml-1">(in {item.functionName})</span>}
        </span>
      </div>

      {/* Right side: File location + Checkbox */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-2xs text-text-tertiary">
          {fileName}:{item.line}
        </span>
        <DeadCodeResultCheckbox item={item} />
      </div>
    </div>
  );
});

DeadCodeResultItem.displayName = 'DeadCodeResultItem';
