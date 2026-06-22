import type { Slide } from '../../../entities/Slide/model/types';

/**
 * 왼쪽으로 이동 (이전 sibling)
 */
export function navigateToLeftSibling(currentSlide: Slide, allSlides: Slide[]): Slide | null {
  const { siblings } = currentSlide.context;

  if (siblings.length === 0) return null;

  // 현재 슬라이드의 인덱스 찾기
  const currentIndex = siblings.indexOf(currentSlide.id);

  // 첫 번째이거나 찾지 못하면 null
  if (currentIndex <= 0) return null;

  // 이전 sibling ID
  const prevSiblingId = siblings[currentIndex - 1];

  // 해당 슬라이드 찾기
  return allSlides.find((slide) => slide.id === prevSiblingId) || null;
}

/**
 * 오른쪽으로 이동 (다음 sibling)
 */
export function navigateToRightSibling(currentSlide: Slide, allSlides: Slide[]): Slide | null {
  const { siblings } = currentSlide.context;

  if (siblings.length === 0) return null;

  // 현재 슬라이드의 인덱스 찾기
  const currentIndex = siblings.indexOf(currentSlide.id);

  // 마지막이거나 찾지 못하면 null
  if (currentIndex === -1 || currentIndex >= siblings.length - 1) return null;

  // 다음 sibling ID
  const nextSiblingId = siblings[currentIndex + 1];

  // 해당 슬라이드 찾기
  return allSlides.find((slide) => slide.id === nextSiblingId) || null;
}
