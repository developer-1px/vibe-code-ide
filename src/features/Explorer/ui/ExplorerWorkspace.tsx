import { useAtomValue } from 'jotai';
import { rightPanelOpenAtom, rightPanelTypeAtom } from '@/entities/AppView/model/atoms';
import { TabContainer } from '@/features/File/OpenFiles/ui/TabContainer';
import { ExplorerSidebar } from './ExplorerSidebar';
import { WorkspacePanel } from './WorkspacePanel';

export function ExplorerWorkspace() {
  const rightPanelOpen = useAtomValue(rightPanelOpenAtom);
  const rightPanelType = useAtomValue(rightPanelTypeAtom);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <ExplorerSidebar />

      <div className="flex-1 relative overflow-hidden">
        <TabContainer />
      </div>

      {rightPanelOpen && rightPanelType === 'workspace' && <WorkspacePanel />}
    </div>
  );
}
