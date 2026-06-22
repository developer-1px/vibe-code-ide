/**
 * App Activity Bar Widget
 * Main navigation bar for the application
 */

import { useAtom } from 'jotai';
import { Settings } from 'lucide-react';
import { activeActivityPageIdAtom } from '@/app/model/activityPageAtoms';
import { primaryActivityPages, secondaryActivityPages } from '@/app/model/activityPages';
import { DocumentModeToggle } from '@/features/DocumentMode/DocumentModeToggle.tsx';
import UploadFolderButton from '@/features/UploadFolderButton.tsx';
import { ActivityBar, ActivityBarItem, ActivityBarSeparator } from './ActivityBar';

export function AppActivityBar() {
  const [activeActivityPageId, setActiveActivityPageId] = useAtom(activeActivityPageIdAtom);

  return (
    <ActivityBar>
      {primaryActivityPages.map((page) => (
        <ActivityBarItem
          key={page.id}
          icon={page.icon}
          label={page.label}
          active={activeActivityPageId === page.id}
          onClick={() => setActiveActivityPageId(page.id)}
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
          onClick={() => setActiveActivityPageId(page.id)}
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
