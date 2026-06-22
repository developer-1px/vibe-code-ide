/**
 * App Activity Bar Widget
 * Main navigation bar for the application
 */

import { useAtom, useSetAtom } from 'jotai';
import { Settings } from 'lucide-react';
import { activeActivityPageIdAtom } from '@/app/model/activityPageAtoms';
import { primaryActivityPages, secondaryActivityPages } from '@/app/model/activityPages';
import { ActivityBar, ActivityBarItem, ActivityBarSeparator } from '@/components/ide/ActivityBar.tsx';
import { viewModeAtom } from '@/entities/AppView/model/atoms';
import { DocumentModeToggle } from '@/features/DocumentMode/DocumentModeToggle.tsx';
import UploadFolderButton from '@/features/UploadFolderButton.tsx';

export function AppActivityBar() {
  const [activeActivityPageId, setActiveActivityPageId] = useAtom(activeActivityPageIdAtom);
  const setViewMode = useSetAtom(viewModeAtom);

  const selectPage = (page: (typeof primaryActivityPages | typeof secondaryActivityPages)[number]) => {
    setActiveActivityPageId(page.id);
    setViewMode(page.legacyViewMode);
  };

  return (
    <ActivityBar>
      {primaryActivityPages.map((page) => (
        <ActivityBarItem
          key={page.id}
          icon={page.icon}
          label={page.label}
          active={activeActivityPageId === page.id}
          onClick={() => selectPage(page)}
        />
      ))}

      {/* Separator: 위는 기본 IDE 뷰, 아래는 독립 페이지 */}
      <ActivityBarSeparator />

      {secondaryActivityPages.map((page) => (
        <ActivityBarItem
          key={page.id}
          icon={page.icon}
          label={page.label}
          active={activeActivityPageId === page.id}
          onClick={() => selectPage(page)}
        />
      ))}

      <div className="flex-1" />

      <UploadFolderButton />
      <div className="px-1">
        <DocumentModeToggle />
      </div>
      <ActivityBarItem icon={Settings} label="Settings" onClick={() => {}} />
    </ActivityBar>
  );
}
