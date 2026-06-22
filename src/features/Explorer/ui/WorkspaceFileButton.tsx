import { useOpenFile } from '@/features/File/OpenFiles/lib/useOpenFile';
import { getFileName } from '@/shared/pathUtils';
import { FileIcon } from '@/shared/ui/FileIcon';

interface WorkspaceFileButtonProps {
  filePath: string;
  activeTab: string | null;
}

export function WorkspaceFileButton({ filePath, activeTab }: WorkspaceFileButtonProps) {
  const fileName = getFileName(filePath);
  const isActive = filePath === activeTab;
  const { openFile } = useOpenFile();

  function handleClick() {
    openFile(filePath);
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:bg-bg-deep transition-colors ${
        isActive ? 'bg-bg-deep text-text-primary' : 'text-text-secondary'
      }`}
      title={filePath}
    >
      <FileIcon fileName={fileName} size={16} />
      <span className="truncate">{fileName}</span>
    </button>
  );
}
