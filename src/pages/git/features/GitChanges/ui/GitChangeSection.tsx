import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { FileChange } from '../../../model/types';
import { GitChangeAllButton } from './GitChangeAllButton';
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

  function handleSectionClick() {
    setIsExpanded(!isExpanded);
  }

  return (
    <div className="space-y-1">
      <div className="w-full flex items-center gap-1 px-1 py-1 hover:bg-white/5 rounded transition-colors">
        <button type="button" onClick={handleSectionClick} className="min-w-0 flex flex-1 items-center gap-1 text-left">
          {isExpanded ? (
            <ChevronDown size={14} className="text-text-muted" />
          ) : (
            <ChevronRight size={14} className="text-text-muted" />
          )}
          <span className="text-xs font-medium text-text-primary flex-1 truncate">{title}</span>
          <span className="text-xs text-text-muted">{files.length}</span>
        </button>
        {files.length > 0 && <GitChangeAllButton allAction={allAction} toggleAll={toggleAll} />}
      </div>

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
