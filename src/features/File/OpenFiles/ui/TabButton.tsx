import { X } from 'lucide-react';
import type React from 'react';
import type { ContentTab } from '../model/contentTabs';

interface TabButtonProps {
  tab: ContentTab;
  isActive: boolean;
  isClosable: boolean;
  activateTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
}

export function TabButton({ tab, isActive, isClosable, activateTab, closeTab }: TabButtonProps) {
  function handleActivateClick() {
    activateTab(tab.id);
  }

  function handleCloseClick(e: React.MouseEvent) {
    e.stopPropagation();
    closeTab(tab.id);
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
