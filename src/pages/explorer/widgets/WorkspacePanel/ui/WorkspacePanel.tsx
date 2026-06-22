/**
 * WorkspacePanel - Right panel showing opened files
 * Displays list of currently opened files with quick navigation
 */

import { useAtomValue } from 'jotai';
import { X } from 'lucide-react';
import { FileIcon } from '@/entities/SourceFileNode/ui/FileIcon';
import { useOpenFile } from '@/features/File/OpenFiles/lib/useOpenFile';
import { activeTabAtom, openedTabsAtom } from '@/features/File/OpenFiles/model/atoms';
import { getFileName } from '@/shared/pathUtils';

interface WorkspacePanelProps {
  onClose: () => void;
}

interface WorkspaceFileButtonProps {
  filePath: string;
  activeTab: string | null;
  onOpenFile: (filePath: string) => void;
}

function WorkspaceFileButton({ filePath, activeTab, onOpenFile }: WorkspaceFileButtonProps) {
  const fileName = getFileName(filePath);
  const isActive = filePath === activeTab;

  function handleClick() {
    onOpenFile(filePath);
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

export function WorkspacePanel({ onClose }: WorkspacePanelProps) {
  const openedTabs = useAtomValue(openedTabsAtom);
  const activeTab = useAtomValue(activeTabAtom);
  const { openFile } = useOpenFile();

  function handleCloseClick() {
    onClose();
  }

  function handleOpenFile(filePath: string) {
    openFile(filePath);
  }

  return (
    <div className="w-[280px] bg-bg-elevated border-l border-border-DEFAULT flex flex-col h-full">
      {/* Header */}
      <div className="flex h-8 items-center justify-between border-b border-border-DEFAULT px-2 flex-shrink-0">
        <span className="text-2xs font-medium text-text-tertiary normal-case">Workspace</span>
        <button
          onClick={handleCloseClick}
          className="rounded p-1 text-text-muted hover:bg-white/5 hover:text-text-secondary transition-colors"
          title="Close Workspace Panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {openedTabs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-tertiary text-xs px-3 text-center">
            No files opened
          </div>
        ) : (
          openedTabs.map((filePath) => (
            <WorkspaceFileButton key={filePath} filePath={filePath} activeTab={activeTab} onOpenFile={handleOpenFile} />
          ))
        )}
      </div>
    </div>
  );
}
