import { useAtomValue } from 'jotai';
import { rightPanelOpenAtom, rightPanelTypeAtom } from '@/entities/AppView/model/atoms';
import { ExplorerSidebar } from './widgets/ExplorerSidebar/ui/ExplorerSidebar';
import { ExplorerTabs } from './widgets/ExplorerTabs/ui/ExplorerTabs';
import { WorkspacePanel } from './widgets/WorkspacePanel/ui/WorkspacePanel';

export function PageExplorer() {
  const rightPanelOpen = useAtomValue(rightPanelOpenAtom);
  const rightPanelType = useAtomValue(rightPanelTypeAtom);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 overflow-hidden">
      <ExplorerSidebar />

      <div className="flex-1 min-h-0 min-w-0 relative overflow-hidden">
        <ExplorerTabs />
      </div>

      {rightPanelOpen && rightPanelType === 'workspace' && <WorkspacePanel />}
    </div>
  );
}
