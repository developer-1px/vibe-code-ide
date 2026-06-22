/**
 * WorkspacePanel - Right panel showing opened files
 * Displays list of currently opened files with quick navigation
 */

import { useAtomValue, useSetAtom } from 'jotai';
import { X } from 'lucide-react';
import { rightPanelOpenAtom } from '@/entities/AppView/model/atoms';
import { useOpenFile } from '@/features/File/OpenFiles/lib/useOpenFile';
import { activeTabAtom, openedTabsAtom } from '@/features/File/OpenFiles/model/atoms';
import { getFileName } from '@/shared/pathUtils';
import { FileIcon } from '@/shared/ui/FileIcon';

interface WorkspaceFileButtonProps {
  filePath: string;
  activeTab: string | null;
}

function WorkspaceFileButton({ filePath, activeTab }: WorkspaceFileButtonProps) {
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

export function WorkspacePanel() {
  const openedTabs = useAtomValue(openedTabsAtom);
  const activeTab = useAtomValue(activeTabAtom);
  const setRightPanelOpen = useSetAtom(rightPanelOpenAtom);

  function handleCloseClick() {
    setRightPanelOpen(false);
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
          openedTabs.map((filePath) => <WorkspaceFileButton key={filePath} filePath={filePath} activeTab={activeTab} />)
        )}
      </div>
    </div>
  );
}
