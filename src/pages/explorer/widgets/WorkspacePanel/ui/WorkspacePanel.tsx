import { useAtomValue } from 'jotai';
import { activeTabAtom, openedTabsAtom } from '@/features/File/OpenFiles/model/atoms';
import { WorkspaceFileButton } from '../../../features/WorkspacePanel/ui/WorkspaceFileButton';
import { WorkspacePanelCloseButton } from '../../../features/WorkspacePanel/ui/WorkspacePanelCloseButton';

export function WorkspacePanel() {
  const openedTabs = useAtomValue(openedTabsAtom);
  const activeTab = useAtomValue(activeTabAtom);

  return (
    <div className="w-[280px] bg-bg-elevated border-l border-border-DEFAULT flex flex-col h-full">
      <div className="flex h-8 items-center justify-between border-b border-border-DEFAULT px-2 flex-shrink-0">
        <span className="text-2xs font-medium text-text-tertiary normal-case">Workspace</span>
        <WorkspacePanelCloseButton />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
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
