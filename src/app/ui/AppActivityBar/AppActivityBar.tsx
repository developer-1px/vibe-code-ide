/**
 * App Activity Bar Widget
 * Main navigation bar for the application
 */

import { useAtom, useSetAtom } from 'jotai';
import {
  BookOpenText,
  FileJson,
  Files,
  GitBranch,
  LucideMap,
  Presentation,
  SearchAlertIcon,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { ActivityBar, ActivityBarItem, ActivityBarSeparator } from '@/components/ide/ActivityBar.tsx';
import { rightPanelOpenAtom, viewModeAtom } from '@/entities/AppView/model/atoms';
import { DocumentModeToggle } from '@/features/DocumentMode/DocumentModeToggle.tsx';
import UploadFolderButton from '@/features/UploadFolderButton.tsx';
import { deadCodePanelOpenAtom } from '@/pages/PageAnalysis/DeadCodePanel/model/atoms.ts';
import { activeTabIdAtom, openedTabsAtom } from '../../../widgets/MainContents/model/atoms';

export function AppActivityBar() {
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const setDeadCodePanelOpen = useSetAtom(deadCodePanelOpenAtom);
  const [_rightPanelOpen, _setRightPanelOpen] = useAtom(rightPanelOpenAtom);
  const setOpenedTabs = useSetAtom(openedTabsAtom);
  const setActiveTabId = useSetAtom(activeTabIdAtom);

  // Active view for ActivityBar (0: Explorer, 1: Search, 2: Dead Code, 3: Canvas, 4: AI, 5: Slides)
  const [activeView, setActiveView] = useState(0);

  // Open Slide View
  const openSlideView = () => {
    const slideTabId = 'slide-view';

    // Add slide tab (check for duplicates)
    setOpenedTabs((tabs) => {
      const exists = tabs.some((tab) => tab.id === slideTabId);
      if (exists) {
        return tabs;
      }
      return [
        ...tabs,
        {
          id: slideTabId,
          type: 'slide',
          label: 'Slides',
        },
      ];
    });

    // Activate slide tab
    setActiveTabId(slideTabId);
    setActiveView(5);
    setViewMode('ide'); // Switch to IDE view to show tabs
    setDeadCodePanelOpen(false);
  };

  return (
    <ActivityBar>
      <ActivityBarItem
        icon={Files}
        label="Explorer"
        active={activeView === 0 && viewMode === 'ide'}
        onClick={() => {
          setActiveView(0);
          setViewMode('ide');
          setDeadCodePanelOpen(false); // ✅ Dead Code Panel 닫기
        }}
      />
      <ActivityBarItem
        icon={BookOpenText}
        label="Code Doc"
        active={viewMode === 'codeDoc'}
        onClick={() => {
          setViewMode('codeDoc');
          setDeadCodePanelOpen(false);
        }}
      />
      <ActivityBarItem icon={Presentation} label="Slides" active={activeView === 5} onClick={openSlideView} />
      <ActivityBarItem
        icon={LucideMap}
        label="Canvas View"
        active={viewMode === 'canvas'}
        onClick={() => {
          setViewMode('canvas');
        }}
      />

      {/* Separator: 위는 기본 IDE 뷰, 아래는 독립 페이지 */}
      <ActivityBarSeparator />

      <ActivityBarItem
        icon={SearchAlertIcon}
        label="Dead Code"
        active={activeView === 2}
        onClick={() => {
          setActiveView(2);
          setDeadCodePanelOpen(true);
          setViewMode('ide');
        }}
      />
      <ActivityBarItem
        icon={FileJson}
        label="JSON Explorer"
        active={viewMode === 'jsonExplorer'}
        onClick={() => {
          setViewMode('jsonExplorer');
          setDeadCodePanelOpen(false);
        }}
      />
      <ActivityBarItem
        icon={Sparkles}
        label="AI Assistant"
        active={activeView === 3}
        onClick={() => setActiveView(3)}
      />
      <ActivityBarItem icon={GitBranch} label="Git" />

      <div className="flex-1" />

      <UploadFolderButton />
      <div className="px-1">
        <DocumentModeToggle />
      </div>
      <ActivityBarItem icon={Settings} label="Settings" onClick={() => {}} />
    </ActivityBar>
  );
}
