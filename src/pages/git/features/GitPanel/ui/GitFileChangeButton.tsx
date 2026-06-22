import { Check, FileText, Minus, Plus, RotateCw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { FileChange } from '../model/types';

function getStatusIcon(status: FileChange['status']) {
  switch (status) {
    case 'added':
      return <Plus size={12} className="text-status-success" />;
    case 'modified':
      return <FileText size={12} className="text-yellow-500" />;
    case 'deleted':
      return <Minus size={12} className="text-red-500" />;
    case 'renamed':
      return <RotateCw size={12} className="text-blue-500" />;
  }
}

function getStatusColor(status: FileChange['status']) {
  switch (status) {
    case 'added':
      return 'text-status-success';
    case 'modified':
      return 'text-yellow-500';
    case 'deleted':
      return 'text-red-500';
    case 'renamed':
      return 'text-blue-500';
  }
}

export function GitFileChangeButton({
  file,
  toggleFileStage,
}: {
  file: FileChange;
  toggleFileStage: (path: string) => void;
}) {
  function handleClick() {
    toggleFileStage(file.path);
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-2 px-2 py-1 hover:bg-white/5 transition-colors text-left rounded group"
    >
      {getStatusIcon(file.status)}
      <span className={cn('text-xs flex-1 truncate', getStatusColor(file.status))}>{file.path}</span>
      <span className="text-2xs text-text-muted uppercase">{file.status.charAt(0)}</span>
      {file.staged ? (
        <Check size={12} className="text-status-success opacity-0 group-hover:opacity-100" />
      ) : (
        <Plus size={12} className="text-text-muted opacity-0 group-hover:opacity-100" />
      )}
    </button>
  );
}
