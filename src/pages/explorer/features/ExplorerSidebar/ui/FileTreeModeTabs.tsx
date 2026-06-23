import type { FileTreeMode } from '@/features/Explorer/model/atoms';

interface FileTreeModeTabsProps {
  fileTreeMode: FileTreeMode;
  changeFileTreeMode: (mode: FileTreeMode) => void;
}

export function FileTreeModeTabs({ fileTreeMode, changeFileTreeMode }: FileTreeModeTabsProps) {
  function handleAllFilesClick() {
    changeFileTreeMode('all');
  }

  function handleRelatedFilesClick() {
    changeFileTreeMode('related');
  }

  return (
    <div className="flex border-b border-border-DEFAULT">
      <button
        type="button"
        onClick={handleAllFilesClick}
        className={`flex-1 px-2 py-1.5 text-2xs font-medium transition-colors ${
          fileTreeMode === 'all'
            ? 'bg-bg-deep text-text-primary border-b-2 border-warm-300'
            : 'text-text-tertiary hover:text-text-secondary'
        }`}
      >
        All Files
      </button>
      <button
        type="button"
        onClick={handleRelatedFilesClick}
        className={`flex-1 px-2 py-1.5 text-2xs font-medium transition-colors ${
          fileTreeMode === 'related'
            ? 'bg-bg-deep text-text-primary border-b-2 border-warm-300'
            : 'text-text-tertiary hover:text-text-secondary'
        }`}
      >
        Related
      </button>
    </div>
  );
}
