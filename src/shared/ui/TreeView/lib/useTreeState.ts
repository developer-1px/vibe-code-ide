/**
 * useTreeState - Tree state management hook
 * Manages collapsed paths and focused index with optional external control
 * Also handles auto-scroll to focused item with margin
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface UseTreeStateProps {
  /** External collapsed paths (optional) */
  collapsedPaths?: Set<string>;
  /** External collapse toggle handler (optional) */
  onToggleCollapse?: (path: string) => void;
  /** External focused index (optional) */
  focusedIndex?: number;
  /** External focus change handler (optional) */
  onFocusChange?: (index: number) => void;
  /** External item refs (optional) */
  itemRefs?: React.MutableRefObject<Map<number, HTMLElement>>;
  /** Scroll container ref - TreeView's root div (required for auto-scroll) */
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export function useTreeState({
  collapsedPaths: externalCollapsed,
  onToggleCollapse: externalToggle,
  focusedIndex: externalFocused,
  onFocusChange: externalFocusChange,
  itemRefs: externalRefs,
  scrollContainerRef,
}: UseTreeStateProps = {}) {
  // Internal states (used when external state not provided)
  const [internalCollapsed, setInternalCollapsed] = useState<Set<string>>(new Set());
  const [internalFocused, setInternalFocused] = useState(0);
  const internalRefs = useRef<Map<number, HTMLElement>>(new Map());
  const prevFocusedIndexRef = useRef<number | undefined>(undefined);

  // Use external state if provided, otherwise use internal state
  const collapsedPaths = externalCollapsed ?? internalCollapsed;
  const focusedIndex = externalFocused ?? internalFocused;
  const itemRefs = externalRefs ?? internalRefs;

  const toggleCollapse = useCallback(
    (path: string) => {
      if (externalToggle) {
        externalToggle(path);
      } else {
        setInternalCollapsed((prev) => {
          const next = new Set(prev);
          if (next.has(path)) {
            next.delete(path);
          } else {
            next.add(path);
          }
          return next;
        });
      }
    },
    [externalToggle]
  );

  const setFocusedIndex = useCallback(
    (index: number) => {
      if (externalFocusChange) {
        externalFocusChange(index);
      } else {
        setInternalFocused(index);
      }
    },
    [externalFocusChange]
  );

  // Auto-scroll to focused item when focusedIndex changes
  useEffect(() => {
    // Skip if focusedIndex hasn't actually changed
    if (prevFocusedIndexRef.current === focusedIndex) {
      console.log('[useTreeState] Skipping auto-scroll - focusedIndex unchanged:', focusedIndex);
      return;
    }

    // Update previous index
    prevFocusedIndexRef.current = focusedIndex;

    // Skip for first item (index 0) - should always be at top, no scroll needed
    if (focusedIndex === 0) {
      console.log('[useTreeState] Skipping auto-scroll - first item should be at top');
      return;
    }

    const focusedElement = itemRefs.current.get(focusedIndex);
    const scrollContainer = scrollContainerRef?.current;

    if (!focusedElement || !scrollContainer) {
      console.log('[useTreeState] Auto-scroll skipped:', {
        hasFocusedElement: !!focusedElement,
        hasScrollContainer: !!scrollContainer,
        focusedIndex,
      });
      return;
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    const elementRect = focusedElement.getBoundingClientRect();

    // Skip if element is not yet laid out properly (width/height = 0)
    if (elementRect.width === 0 || elementRect.height === 0) {
      console.log('[useTreeState] Auto-scroll skipped - element not yet laid out:', {
        focusedIndex,
        width: elementRect.width,
        height: elementRect.height,
      });
      return;
    }

    // Skip if element position seems invalid (way outside container)
    const maxDistance = containerRect.height * 3; // Allow 3x container height
    if (Math.abs(elementRect.top - containerRect.top) > maxDistance) {
      console.log('[useTreeState] Auto-scroll skipped - element position invalid:', {
        focusedIndex,
        elementTop: elementRect.top,
        containerTop: containerRect.top,
        distance: Math.abs(elementRect.top - containerRect.top),
        maxDistance,
      });
      return;
    }

    // 위아래 여유 공간: 2개 항목 정도 (항목 높이를 28px로 가정)
    const margin = 28 * 2;

    console.log('[useTreeState] Auto-scroll check:', {
      focusedIndex,
      elementTop: elementRect.top,
      elementBottom: elementRect.bottom,
      containerTop: containerRect.top,
      containerBottom: containerRect.bottom,
      topThreshold: containerRect.top + margin,
      bottomThreshold: containerRect.bottom - margin,
    });

    // 요소가 컨테이너 상단 여백보다 위에 있으면 위로 스크롤
    if (elementRect.top < containerRect.top + margin) {
      const scrollAmount = containerRect.top + margin - elementRect.top;
      console.log('[useTreeState] Scrolling UP by:', scrollAmount);
      scrollContainer.scrollTop -= scrollAmount;
    }
    // 요소가 컨테이너 하단 여백보다 아래에 있으면 아래로 스크롤
    else if (elementRect.bottom > containerRect.bottom - margin) {
      const scrollAmount = elementRect.bottom - (containerRect.bottom - margin);
      console.log('[useTreeState] Scrolling DOWN by:', scrollAmount);
      scrollContainer.scrollTop += scrollAmount;
    } else {
      console.log('[useTreeState] No scroll needed - element in view with margin');
    }
  }, [focusedIndex, scrollContainerRef]);

  return {
    collapsedPaths,
    toggleCollapse,
    focusedIndex,
    setFocusedIndex,
    itemRefs,
  };
}
