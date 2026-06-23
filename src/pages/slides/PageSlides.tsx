import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { graphDataAtom } from '@/entities/AppView/model/atoms';
import { activeTabAtom, openedTabsAtom } from '@/features/File/OpenFiles/model/atoms';
import { buildSlidesFromFiles } from './entities/Slide/lib/slideBuilder';
import { currentSlideAtom, currentSlideIdAtom, slidesAtom } from './features/SlideNavigation/model/atoms';
import { SlideKeyboardScope } from './features/SlideNavigation/ui/SlideKeyboardScope';
import { SlideContextPanel } from './widgets/SlideContextPanel/ui/SlideContextPanel';
import { SlideDeck } from './widgets/SlideDeck/ui/SlideDeck';

export function PageSlides() {
  const graphData = useAtomValue(graphDataAtom);
  const openedTabs = useAtomValue(openedTabsAtom);
  const activeTab = useAtomValue(activeTabAtom);
  const currentSlide = useAtomValue(currentSlideAtom);
  const slides = useAtomValue(slidesAtom);
  const setSlides = useSetAtom(slidesAtom);
  const setCurrentSlideId = useSetAtom(currentSlideIdAtom);

  useEffect(() => {
    console.log('[PageSlides] Current state:', {
      slidesCount: slides.length,
      currentSlideId: currentSlide?.id,
      openedTabsCount: openedTabs.length,
      activeTab,
    });
  }, [slides.length, currentSlide, openedTabs.length, activeTab]);

  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      setSlides([]);
      return;
    }

    if (openedTabs.length === 0) {
      setSlides([]);
      return;
    }

    const fullNodeMap = new Map(graphData.nodes.map((node) => [node.id, node]));
    const newSlides = buildSlidesFromFiles(fullNodeMap, openedTabs);
    setSlides(newSlides);

    if (newSlides.length > 0) {
      setCurrentSlideId((prevId) => {
        if (prevId && newSlides.some((slide) => slide.id === prevId)) {
          return prevId;
        }

        if (activeTab) {
          const activeTabSlide = newSlides.find((slide) => slide.context.filePath === activeTab);
          if (activeTabSlide) {
            return activeTabSlide.id;
          }
        }

        return newSlides[0].id;
      });
    }
  }, [graphData, openedTabs, activeTab, setSlides, setCurrentSlideId]);

  if (slides.length === 0) {
    return (
      <div className="h-full min-h-0 w-full min-w-0 overflow-hidden">
        <SlideKeyboardScope />
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-text-tertiary text-sm mb-2">No slides available</div>
            <div className="text-text-faint text-xs">
              Open files (Shift+Shift or click in sidebar) to view code slides
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSlide) {
    return (
      <div className="h-full min-h-0 w-full min-w-0 overflow-hidden">
        <SlideKeyboardScope />
        <div className="flex items-center justify-center h-full">
          <div className="text-text-tertiary text-sm">Loading slide...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 gap-4 overflow-hidden p-4">
      <SlideKeyboardScope />
      <div className="flex-[7] min-w-0">
        <SlideDeck slide={currentSlide} />
      </div>
      <div className="flex-[3] min-w-0">
        <SlideContextPanel slide={currentSlide} />
      </div>
    </div>
  );
}
