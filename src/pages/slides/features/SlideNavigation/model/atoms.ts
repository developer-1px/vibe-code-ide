import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { Slide, SlideChunk } from '../../../entities/Slide/model/types';

/**
 * 전체 슬라이드 목록
 * buildSlides()로 생성된 슬라이드들
 */
export const slidesAtom = atom<Slide[]>([]);

/**
 * 현재 슬라이드 ID (localStorage에 저장)
 */
export const currentSlideIdAtom = atomWithStorage<string | null>('vibe-current-slide-id', null);

/**
 * 현재 슬라이드 (derived atom)
 */
export const currentSlideAtom = atom<Slide | null>((get) => {
  const slides = get(slidesAtom);
  const currentId = get(currentSlideIdAtom);

  if (!currentId) return slides[0] || null;

  return slides.find((slide) => slide.id === currentId) || null;
});

/**
 * 슬라이드 네비게이션 히스토리
 * 브라우저 백/포워드처럼 이동 기록 관리
 */
export const slideHistoryAtom = atom<string[]>([]);

/**
 * 히스토리 인덱스
 */
export const historyIndexAtom = atom<number>(-1);

/**
 * 현재 슬라이드 변경 (히스토리에 추가)
 */
export const setCurrentSlideWithHistoryAtom = atom(null, (get, set, slideId: string) => {
  const history = get(slideHistoryAtom);
  const currentIndex = get(historyIndexAtom);

  // 현재 위치 이후의 히스토리는 제거 (새 분기)
  const newHistory = history.slice(0, currentIndex + 1);
  newHistory.push(slideId);

  set(slideHistoryAtom, newHistory);
  set(historyIndexAtom, newHistory.length - 1);
  set(currentSlideIdAtom, slideId);
});

/**
 * 히스토리 뒤로 가기
 */
export const goBackAtom = atom(null, (get, set) => {
  const history = get(slideHistoryAtom);
  const currentIndex = get(historyIndexAtom);

  if (currentIndex > 0) {
    const newIndex = currentIndex - 1;
    set(historyIndexAtom, newIndex);
    set(currentSlideIdAtom, history[newIndex]);
  }
});

/**
 * 히스토리 앞으로 가기
 */
export const goForwardAtom = atom(null, (get, set) => {
  const history = get(slideHistoryAtom);
  const currentIndex = get(historyIndexAtom);

  if (currentIndex < history.length - 1) {
    const newIndex = currentIndex + 1;
    set(historyIndexAtom, newIndex);
    set(currentSlideIdAtom, history[newIndex]);
  }
});

/**
 * 현재 포커스할 fold의 인덱스
 * -1: fold 없음 (전체 표시)
 * 0~N: 해당 fold에 포커스
 */
export const currentFoldIndexAtom = atom<number>(-1);

/**
 * 현재 슬라이드의 fold 개수
 * (SlideContent에서 계산해서 설정)
 */
export const foldCountAtom = atom<number>(0);

/**
 * 현재 슬라이드의 foldable 라인 정보
 * (트리 네비게이션에 사용)
 */
export interface FoldableLineInfo {
  lineNum: number;
  foldStart: number;
  foldEnd: number;
  depth: number;
}

export const foldableLinesAtom = atom<FoldableLineInfo[]>([]);

/**
 * 위아래 이동 시 목표로 하는 depth (에디터 column 기억 방식)
 * 좌우 이동 시 현재 depth로 갱신됨
 */
export const targetDepthAtom = atom<number>(0);

/**
 * 현재 슬라이드의 chunk 목록
 */
export const chunksAtom = atom<SlideChunk[]>([]);

/**
 * 현재 포커스할 chunk의 인덱스
 * -1: chunk 없음 (전체 표시)
 * 0~N: 해당 chunk에 포커스
 */
export const currentChunkIndexAtom = atom<number>(-1);

/**
 * 현재 슬라이드의 chunk 개수
 */
export const chunkCountAtom = atom<number>(0);
