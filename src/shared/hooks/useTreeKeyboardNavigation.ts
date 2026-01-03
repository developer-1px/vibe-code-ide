/**
 * useTreeKeyboardNavigation - 트리 구조 키보드 네비게이션 공통 로직
 * AppSidebar와 DeadCodePanel에서 재사용
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

const TREE_HOTKEYS = {
  ARROW_DOWN: 'arrowdown',
  ARROW_UP: 'arrowup',
  ENTER: 'enter',
  ARROW_RIGHT: 'arrowright',
  ARROW_LEFT: 'arrowleft',
} as const;

export interface TreeNavigationItem {
  type: 'folder' | 'file' | 'dead-code-item' | string;
  path: string;
  filePath?: string;
}

export interface UseTreeKeyboardNavigationProps<T extends TreeNavigationItem> {
  flatItemList: T[];
  collapsedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onItemAction: (item: T) => void; // Enter 키나 더블 클릭 시 실행할 액션
}

export function useTreeKeyboardNavigation<T extends TreeNavigationItem>({
  flatItemList,
  collapsedFolders,
  onToggleFolder,
  onItemAction,
}: UseTreeKeyboardNavigationProps<T>) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Auto-scroll to focused item when focusedIndex changes
  useEffect(() => {
    const focusedElement = itemRefs.current.get(focusedIndex);
    if (focusedElement) {
      focusedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'auto',
      });
    }
  }, [focusedIndex]);

  // Keyboard navigation handler
  const containerRef = useHotkeys(
    Object.values(TREE_HOTKEYS),
    (e, { hotkey }) => {
      if (flatItemList.length === 0) return;

      e.preventDefault();
      const item = flatItemList[focusedIndex];

      if (!item) {
        console.warn('[useTreeKeyboardNavigation] No item at focusedIndex:', focusedIndex);
        return;
      }

      switch (hotkey) {
        case TREE_HOTKEYS.ARROW_DOWN:
          setFocusedIndex((prev) => Math.min(prev + 1, flatItemList.length - 1));
          break;
        case TREE_HOTKEYS.ARROW_UP:
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case TREE_HOTKEYS.ENTER:
          if (item.type === 'folder') {
            onToggleFolder(item.path);
          } else {
            // Handle file or any other item type
            onItemAction(item);
          }
          break;
        case TREE_HOTKEYS.ARROW_RIGHT:
          if (item.type === 'folder' && collapsedFolders.has(item.path)) {
            console.log('[useTreeKeyboardNavigation] Arrow Right - Expanding folder:', item.path);
            onToggleFolder(item.path);
          }
          break;
        case TREE_HOTKEYS.ARROW_LEFT:
          if (item.type === 'folder' && !collapsedFolders.has(item.path)) {
            console.log('[useTreeKeyboardNavigation] Arrow Left - Collapsing folder:', item.path);
            onToggleFolder(item.path);
          }
          break;
      }
    },
    {},
    [flatItemList, focusedIndex, onItemAction, collapsedFolders, onToggleFolder]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    itemRefs,
    containerRef,
  };
}
