import { useAtomValue, useSetAtom } from 'jotai';
import { rightPanelOpenAtom, rightPanelTypeAtom } from '@/entities/AppView/model/atoms';
import { TabContainer } from '@/widgets/MainContents/TabContainer';
import { ExplorerSidebar } from '../../ExplorerSidebar/ui/ExplorerSidebar';
import { WorkspacePanel } from '../../WorkspacePanel/ui/WorkspacePanel';

export function ExplorerWorkspace() {
  const rightPanelOpen = useAtomValue(rightPanelOpenAtom);
  const rightPanelType = useAtomValue(rightPanelTypeAtom);
  const setRightPanelOpen = useSetAtom(rightPanelOpenAtom);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <ExplorerSidebar />

      <div className="flex-1 relative overflow-hidden">
        <TabContainer />
      </div>

      {rightPanelOpen && rightPanelType === 'workspace' && <WorkspacePanel onClose={() => setRightPanelOpen(false)} />}
    </div>
  );
}
