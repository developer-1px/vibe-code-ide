import { useAtomValue } from 'jotai';
import { rightPanelOpenAtom, rightPanelTypeAtom } from '@/entities/AppView/model/atoms';
import { TabContainer } from '@/features/File/OpenFiles/ui/TabContainer';
import { ExplorerSidebar } from './ExplorerSidebar';
import { WorkspacePanel } from './WorkspacePanel';

export function ExplorerWorkspace() {
  const rightPanelOpen = useAtomValue(rightPanelOpenAtom);
  const rightPanelType = useAtomValue(rightPanelTypeAtom);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 overflow-hidden">
      <ExplorerSidebar />

      <div className="flex-1 min-h-0 min-w-0 relative overflow-hidden">
        <TabContainer />
      </div>

      {rightPanelOpen && rightPanelType === 'workspace' && <WorkspacePanel />}
    </div>
  );
}
