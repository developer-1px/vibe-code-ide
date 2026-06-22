/**
 * Slide Open Button
 * Opens Slide View tab
 */

import { useSetAtom } from 'jotai';
import { Presentation } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { activeTabIdAtom, openedTabsAtom } from '../../../widgets/MainContents/model/atoms';

export const SlideOpenButton = () => {
  const setOpenedTabs = useSetAtom(openedTabsAtom);
  const setActiveTabId = useSetAtom(activeTabIdAtom);

  const openSlideView = () => {
    const slideTabId = 'slide-view';

    // 슬라이드 탭 추가 (중복 체크)
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

    // 슬라이드 탭 활성화
    setActiveTabId(slideTabId);
  };

  return (
    <Button variant="outline" size="sm" onClick={openSlideView} className="flex items-center gap-2">
      <Presentation size={16} />
      <span>Slides</span>
    </Button>
  );
};
