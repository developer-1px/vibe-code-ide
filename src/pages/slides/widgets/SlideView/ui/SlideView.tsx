import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { graphDataAtom } from '@/entities/AppView/model/atoms';
import { activeTabAtom, openedTabsAtom } from '@/features/File/OpenFiles/model/atoms';
import { buildSlidesFromFiles } from '../../../entities/Slide/lib/slideBuilder';
import { currentSlideAtom, currentSlideIdAtom, slidesAtom } from '../../../features/SlideNavigation/model/atoms';
import SlideContent from './SlideContent';
import SlideContext from './SlideContext';
import { SlideKeyboardScope } from './SlideKeyboardScope';

/**
 * SlideView - PPT 스타일 코드 뷰어
 */
const SlideView = () => {
  const graphData = useAtomValue(graphDataAtom);
  const openedTabs = useAtomValue(openedTabsAtom);
  const activeTab = useAtomValue(activeTabAtom);
  const currentSlide = useAtomValue(currentSlideAtom);
  const slides = useAtomValue(slidesAtom);
  const setSlides = useSetAtom(slidesAtom);
  const setCurrentSlideId = useSetAtom(currentSlideIdAtom);

  // 디버깅 로그
  useEffect(() => {
    console.log('[SlideView] Component mounted');
    console.log('[SlideView] Current state:', {
      slidesCount: slides.length,
      currentSlideId: currentSlide?.id,
      openedTabsCount: openedTabs.length,
      activeTab,
    });
  }, [slides.length, currentSlide, openedTabs.length, activeTab]);

  // openedTabs가 변경되면 슬라이드 재생성
  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      setSlides([]);
      return;
    }

    if (openedTabs.length === 0) {
      setSlides([]);
      return;
    }

    // SourceFileNode를 Map으로 변환
    const fullNodeMap = new Map(graphData.nodes.map((node) => [node.id, node]));

    // 열린 파일들의 함수만 슬라이드로 생성
    const newSlides = buildSlidesFromFiles(fullNodeMap, openedTabs);
    setSlides(newSlides);

    // 초기 슬라이드 선택
    if (newSlides.length > 0) {
      setCurrentSlideId((prevId) => {
        // 이미 슬라이드 ID가 있고 유효하면 유지
        if (prevId && newSlides.some((s) => s.id === prevId)) {
          return prevId;
        }

        // activeTab의 첫 함수로 이동 (있으면)
        if (activeTab) {
          const activeTabSlide = newSlides.find((s) => s.context.filePath === activeTab);
          if (activeTabSlide) {
            return activeTabSlide.id;
          }
        }

        // 없으면 첫 슬라이드로
        return newSlides[0].id;
      });
    }
  }, [graphData, openedTabs, activeTab, setSlides, setCurrentSlideId]);

  // 슬라이드가 없으면 빈 상태 표시
  if (slides.length === 0) {
    return (
      <>
        <SlideKeyboardScope />
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-text-tertiary text-sm mb-2">No slides available</div>
            <div className="text-text-faint text-xs">
              Open files (Shift+Shift or click in sidebar) to view code slides
            </div>
          </div>
        </div>
      </>
    );
  }

  // 현재 슬라이드가 없으면 로딩 상태
  if (!currentSlide) {
    return (
      <>
        <SlideKeyboardScope />
        <div className="flex items-center justify-center h-full">
          <div className="text-text-tertiary text-sm">Loading slide...</div>
        </div>
      </>
    );
  }

  return (
    <div className="flex h-full gap-4 p-4">
      <SlideKeyboardScope />
      {/* 메인 슬라이드 영역 (70%) */}
      <div className="flex-[7]">
        <SlideContent slide={currentSlide} />
      </div>

      {/* 컨텍스트 사이드바 (30%) */}
      <div className="flex-[3]">
        <SlideContext slide={currentSlide} />
      </div>
    </div>
  );
};

export default SlideView;
