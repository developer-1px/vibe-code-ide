/**
 * 키보드 단축키 관리 컴포넌트
 * - 전역 키보드 이벤트를 한 곳에서 관리
 * - 렌더링 없는 로직 전용 컴포넌트
 */

import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { activeActivityPageIdAtom } from '@/app/model/activityPageAtoms';
import { viewModeAtom } from '@/entities/AppView/model/atoms';
import { useOpenFile } from '@/features/File/OpenFiles/lib/useOpenFile';
import { searchModalOpenAtom } from '@/features/Search/UnifiedSearch/model/atoms';
import { isSidebarOpenAtom } from '@/pages/explorer/widgets/ExplorerSidebar/model/atoms';
import { activeTabIdAtom, openedTabsAtom } from '@/widgets/MainContents/model/atoms';

const GLOBAL_HOTKEYS = {
  TOGGLE_SIDEBAR: 'mod+\\',
  TOGGLE_CODE_DOC_PAGE: 'backquote',
  CLOSE_FILE: 'mod+w',
  CLOSE_FILE_ESC: 'escape',
  CONTENT_SEARCH: 'mod+shift+f',
  NEW_SEARCH_TAB: 'mod+shift+tab',
} as const;

export const KeyboardShortcuts = () => {
  const setIsSidebarOpen = useSetAtom(isSidebarOpenAtom);
  const setSearchModalOpen = useSetAtom(searchModalOpenAtom);
  const setViewMode = useSetAtom(viewModeAtom);
  const [activeActivityPageId, setActiveActivityPageId] = useAtom(activeActivityPageIdAtom);
  const { closeFile } = useOpenFile();
  const [openedTabs, setOpenedTabs] = useAtom(openedTabsAtom);
  const setActiveTabId = useSetAtom(activeTabIdAtom);

  const openSearchTab = useCallback(() => {
    const existingSearchTab = openedTabs.find((tab) => tab.type === 'search');

    if (existingSearchTab) {
      setActiveTabId(existingSearchTab.id);
    } else {
      const newSearchTab = {
        id: `search-${Date.now()}`,
        type: 'search' as const,
        label: 'Search',
      };
      setOpenedTabs([...openedTabs, newSearchTab]);
      setActiveTabId(newSearchTab.id);
    }

    setActiveActivityPageId('explorer');
    setViewMode('contentSearch');
  }, [openedTabs, setActiveActivityPageId, setActiveTabId, setOpenedTabs, setViewMode]);

  // Global hotkeys (no ref needed - always active)
  useHotkeys(
    Object.values(GLOBAL_HOTKEYS),
    (e, { hotkey }) => {
      console.log('[KeyboardShortcuts] Hotkey pressed:', hotkey);
      e.preventDefault();

      switch (hotkey) {
        case GLOBAL_HOTKEYS.TOGGLE_SIDEBAR:
          setIsSidebarOpen((prev) => !prev);
          break;
        case GLOBAL_HOTKEYS.TOGGLE_CODE_DOC_PAGE:
          // Explorer ↔ CodeDoc page 전환
          if (activeActivityPageId === 'code-doc') {
            setActiveActivityPageId('explorer');
            setViewMode('ide');
            console.log('[KeyboardShortcuts] Activity page toggled: explorer');
          } else {
            setActiveActivityPageId('code-doc');
            console.log('[KeyboardShortcuts] Activity page toggled: code-doc');
          }
          break;
        case GLOBAL_HOTKEYS.CLOSE_FILE:
        case GLOBAL_HOTKEYS.CLOSE_FILE_ESC:
          closeFile();
          console.log('[KeyboardShortcuts] Close current file');
          break;
        case GLOBAL_HOTKEYS.CONTENT_SEARCH:
          openSearchTab();
          console.log('[KeyboardShortcuts] Content search view opened');
          break;
        case GLOBAL_HOTKEYS.NEW_SEARCH_TAB:
          openSearchTab();
          console.log('[KeyboardShortcuts] New search tab opened');
          break;
      }
    },
    { enableOnFormTags: true },
    [setIsSidebarOpen, setViewMode, activeActivityPageId, setActiveActivityPageId, closeFile, openSearchTab]
  );

  // Shift+Shift (더블탭) - 검색 모달 열기
  const lastShiftPressRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        const now = Date.now();
        const timeSinceLastPress = now - lastShiftPressRef.current;

        // 더블탭 감지
        if (timeSinceLastPress < 300) {
          e.preventDefault();
          setSearchModalOpen(true);
          lastShiftPressRef.current = 0; // 리셋
        } else {
          lastShiftPressRef.current = now;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchModalOpen]);

  // 렌더링 없음
  return null;
};
