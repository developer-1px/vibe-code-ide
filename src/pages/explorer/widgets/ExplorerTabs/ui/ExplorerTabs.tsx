import { useAtom } from 'jotai';
import { activeTabIdAtom, openedTabsAtom } from '@/features/File/OpenFiles/model/contentTabs';
import { ContentSearchView } from '@/pages/explorer/features/ContentSearch/ui/ContentSearchView';
import IDEScrollView from '@/pages/shared/features/OpenFiles/ui/IDEScrollView';
import { TabButton } from '../../../features/ExplorerTabs/ui/TabButton';

export function ExplorerTabs() {
  const [openedTabs, setOpenedTabs] = useAtom(openedTabsAtom);
  const [activeTabId, setActiveTabId] = useAtom(activeTabIdAtom);

  const activeTab = openedTabs.find((tab) => tab.id === activeTabId);

  function handleTabClose(tabId: string) {
    const tabIndex = openedTabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1 || openedTabs.length === 1) return;

    const nextTabs = openedTabs.filter((tab) => tab.id !== tabId);
    setOpenedTabs(nextTabs);

    if (activeTabId === tabId) {
      const nextActiveIndex = Math.max(0, tabIndex - 1);
      setActiveTabId(nextTabs[nextActiveIndex].id);
    }
  }

  function handleTabActivate(tabId: string) {
    setActiveTabId(tabId);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="flex items-center border-b border-border-DEFAULT bg-bg-elevated flex-shrink-0 overflow-x-auto">
        {openedTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isClosable = openedTabs.length > 1;

          return (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={isActive}
              isClosable={isClosable}
              activateTab={handleTabActivate}
              closeTab={handleTabClose}
            />
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab?.type === 'ide' && <IDEScrollView />}
        {activeTab?.type === 'search' && <ContentSearchView />}
      </div>
    </div>
  );
}
