import { useAtomValue, useSetAtom } from 'jotai';
import AppSidebar from '@/app/ui/AppSidebar/AppSidebar';
import { rightPanelOpenAtom, rightPanelTypeAtom } from '@/entities/AppView/model/atoms';
import { TabContainer } from '@/widgets/MainContents/TabContainer';
import { WorkspacePanel } from '@/widgets/WorkspacePanel/WorkspacePanel';

export function PageExplorer() {
  const rightPanelOpen = useAtomValue(rightPanelOpenAtom);
  const rightPanelType = useAtomValue(rightPanelTypeAtom);
  const setRightPanelOpen = useSetAtom(rightPanelOpenAtom);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <AppSidebar />

      <div className="flex-1 relative overflow-hidden">
        <TabContainer />
      </div>

      {rightPanelOpen && rightPanelType === 'workspace' && <WorkspacePanel onClose={() => setRightPanelOpen(false)} />}
    </div>
  );
}
