import { useAtom } from 'jotai';
import { activeTabIdAtom, openedTabsAtom } from '@/features/File/OpenFiles/model/contentTabs';
import { ContentSearchView } from '@/pages/explorer/features/ContentSearch/ui/ContentSearchView';
import IDEScrollView from '@/pages/shared/features/OpenFiles/ui/IDEScrollView/IDEScrollView';
import { TabButton } from './TabButton';

export function ExplorerTabs() {
  const [openedTabs, setOpenedTabs] = useAtom(openedTabsAtom);
  const [activeTabId, setActiveTabId] = useAtom(activeTabIdAtom);

  const activeTab = openedTabs.find((tab) => tab.id === activeTabId);

  function closeTab(tabId: string) {
    const tabIndex = openedTabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1 || openedTabs.length === 1) return; // 마지막 탭은 닫지 않음

    const newTabs = openedTabs.filter((tab) => tab.id !== tabId);
    setOpenedTabs(newTabs);

    // 닫은 탭이 활성 탭이면 다른 탭으로 전환
    if (activeTabId === tabId) {
      const newActiveIndex = Math.max(0, tabIndex - 1);
      setActiveTabId(newTabs[newActiveIndex].id);
    }
  }

  function activateTab(tabId: string) {
    setActiveTabId(tabId);
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Tab Bar */}
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
              activateTab={activateTab}
              closeTab={closeTab}
            />
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab?.type === 'ide' && <IDEScrollView />}
        {activeTab?.type === 'search' && <ContentSearchView />}
      </div>
    </div>
  );
}
