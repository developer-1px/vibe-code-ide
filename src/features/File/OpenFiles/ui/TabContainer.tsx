/**
 * TabContainer - Main content tab container
 * Dynamic horizontal tabs for IDE and Search views
 */

import { useAtom } from 'jotai';
import { X } from 'lucide-react';
import type React from 'react';
import { ContentSearchView } from '@/features/Search/ContentSearch/ui/ContentSearchView';
import { activeTabIdAtom, type ContentTab, openedTabsAtom } from '../model/contentTabs';
import IDEScrollView from './IDEScrollView/IDEScrollView';

interface TabButtonProps {
  tab: ContentTab;
  isActive: boolean;
  isClosable: boolean;
  onActivateTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

function TabButton({ tab, isActive, isClosable, onActivateTab, onCloseTab }: TabButtonProps) {
  function handleActivateClick() {
    onActivateTab(tab.id);
  }

  function handleCloseClick(e: React.MouseEvent) {
    e.stopPropagation();
    onCloseTab(tab.id);
  }

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 border-b-2 transition-colors flex-shrink-0 ${
        isActive ? 'border-warm-300 bg-bg-elevated' : 'border-transparent hover:bg-bg-DEFAULT'
      }`}
    >
      <button
        type="button"
        onClick={handleActivateClick}
        className={`text-xs font-medium transition-colors ${
          isActive ? 'text-text-primary' : 'text-text-tertiary group-hover:text-text-secondary'
        }`}
      >
        {tab.label}
      </button>
      {isClosable && (
        <button
          type="button"
          onClick={handleCloseClick}
          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-bg-deep rounded p-0.5"
          aria-label="Close tab"
        >
          <X size={12} className="text-text-tertiary hover:text-text-primary" />
        </button>
      )}
    </div>
  );
}

export function TabContainer() {
  const [openedTabs, setOpenedTabs] = useAtom(openedTabsAtom);
  const [activeTabId, setActiveTabId] = useAtom(activeTabIdAtom);

  const activeTab = openedTabs.find((tab) => tab.id === activeTabId);

  function handleCloseTab(tabId: string) {
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

  function handleActivateTab(tabId: string) {
    setActiveTabId(tabId);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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
              onActivateTab={handleActivateTab}
              onCloseTab={handleCloseTab}
            />
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab?.type === 'ide' && <IDEScrollView />}
        {activeTab?.type === 'search' && <ContentSearchView />}
      </div>
    </div>
  );
}
