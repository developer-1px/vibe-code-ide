import { getFileName } from '@/shared/pathUtils.ts';
import { FileIcon } from '@/shared/ui/FileIcon';

interface FileNavButtonProps {
  filePath: string;
  isActive: boolean;
  selectFile: (filePath: string) => void;
}

export function FileNavButton({ filePath, isActive, selectFile }: FileNavButtonProps) {
  const fileName = getFileName(filePath);

  function handleClick() {
    selectFile(filePath);
  }

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center gap-2 px-3 py-2 text-left transition-colors
        hover:bg-bg-hover
        ${isActive ? 'bg-warm-500/10 border-l-2 border-warm-300' : 'border-l-2 border-transparent'}
      `}
    >
      <FileIcon
        fileName={fileName}
        size={12}
        className={`shrink-0 ${isActive ? 'text-warm-300' : 'text-text-tertiary'}`}
      />
      <div className="flex flex-col min-w-0">
        <span className={`text-xs truncate ${isActive ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
          {fileName}
        </span>
      </div>
    </button>
  );
}
