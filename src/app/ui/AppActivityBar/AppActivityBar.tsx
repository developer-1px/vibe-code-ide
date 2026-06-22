/**
 * App Activity Bar Widget
 * Main navigation bar for the application
 */

import { useAtom } from 'jotai';
import { Settings } from 'lucide-react';
import { activeActivityPageIdAtom } from '@/app/model/activityPageAtoms';
import {
  type ActivityPageDescriptor,
  type ActivityPageId,
  primaryActivityPages,
  secondaryActivityPages,
} from '@/app/model/activityPages';
import { DocumentModeToggle } from '@/features/DocumentMode/DocumentModeToggle.tsx';
import UploadFolderButton from '@/features/UploadFolderButton.tsx';
import { ActivityBar, ActivityBarItem, ActivityBarSeparator } from './ActivityBar';

interface ActivityPageItemProps {
  page: ActivityPageDescriptor;
  activeActivityPageId: ActivityPageId;
  onSelectPage: (pageId: ActivityPageId) => void;
}

function ActivityPageItem({ page, activeActivityPageId, onSelectPage }: ActivityPageItemProps) {
  function handleClick() {
    onSelectPage(page.id);
  }

  return (
    <ActivityBarItem
      icon={page.icon}
      label={page.label}
      active={activeActivityPageId === page.id}
      onClick={handleClick}
    />
  );
}

export function AppActivityBar() {
  const [activeActivityPageId, setActiveActivityPageId] = useAtom(activeActivityPageIdAtom);

  function handleSelectPage(pageId: ActivityPageId) {
    setActiveActivityPageId(pageId);
  }

  function handleSettingsClick() {}

  return (
    <ActivityBar>
      {primaryActivityPages.map((page) => (
        <ActivityPageItem
          key={page.id}
          page={page}
          activeActivityPageId={activeActivityPageId}
          onSelectPage={handleSelectPage}
        />
      ))}

      {/* Separator: 위는 기본 IDE 뷰, 아래는 독립 페이지 */}
      <ActivityBarSeparator />

      {secondaryActivityPages.map((page) => (
        <ActivityPageItem
          key={page.id}
          page={page}
          activeActivityPageId={activeActivityPageId}
          onSelectPage={handleSelectPage}
        />
      ))}

      <div className="flex-1" />

      <UploadFolderButton />
      <div className="px-1">
        <DocumentModeToggle />
      </div>
      <ActivityBarItem icon={Settings} label="Settings" onClick={handleSettingsClick} />
    </ActivityBar>
  );
}
