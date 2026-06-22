import { ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import type { FileChange } from '../model/types';
import { GitFileChangeButton } from './GitFileChangeButton';

export function GitChangeSection({
  title,
  emptyMessage,
  files,
  allAction,
  toggleAll,
  toggleFileStage,
}: {
  title: string;
  emptyMessage: string;
  files: FileChange[];
  allAction: 'stage' | 'unstage';
  toggleAll: () => void;
  toggleFileStage: (path: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const AllActionIcon = allAction === 'stage' ? Plus : Minus;
  const allActionLabel = allAction === 'stage' ? 'Stage All' : 'Unstage All';

  function handleSectionClick() {
    setIsExpanded(!isExpanded);
  }

  function handleToggleAllClick(e: React.MouseEvent) {
    e.stopPropagation();
    toggleAll();
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleSectionClick}
        className="w-full flex items-center gap-1 px-1 py-1 hover:bg-white/5 rounded transition-colors"
      >
        {isExpanded ? (
          <ChevronDown size={14} className="text-text-muted" />
        ) : (
          <ChevronRight size={14} className="text-text-muted" />
        )}
        <span className="text-xs font-medium text-text-primary flex-1 text-left">{title}</span>
        <span className="text-xs text-text-muted">{files.length}</span>
        {files.length > 0 && (
          <Button variant="ghost" size="sm" className="h-5 px-1 text-2xs" onClick={handleToggleAllClick}>
            <AllActionIcon size={10} className="mr-0.5" />
            {allActionLabel}
          </Button>
        )}
      </button>

      {isExpanded && (
        <div className="ml-2 space-y-0.5">
          {files.length > 0 ? (
            files.map((file) => <GitFileChangeButton key={file.path} file={file} toggleFileStage={toggleFileStage} />)
          ) : (
            <div className="px-2 py-3 text-xs text-text-muted text-center">{emptyMessage}</div>
          )}
        </div>
      )}
    </div>
  );
}
