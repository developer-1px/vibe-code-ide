import type { Slide } from '../../../entities/Slide/model/types';

/**
 * 위로 이동 (caller - 나를 호출하는 함수)
 */
export function navigateToCaller(currentSlide: Slide, allSlides: Slide[]): Slide | null {
  const { callers } = currentSlide.context;

  if (callers.length === 0) return null;

  // 첫 번째 caller로 이동
  const firstCallerId = callers[0];

  // 해당 슬라이드 찾기
  return allSlides.find((slide) => slide.id === firstCallerId) || null;
}

/**
 * 아래로 이동 (callee - 내가 호출하는 함수)
 */
export function navigateToCallee(currentSlide: Slide, allSlides: Slide[]): Slide | null {
  const { callees } = currentSlide.context;

  if (callees.length === 0) return null;

  // 첫 번째 callee로 이동
  const firstCalleeId = callees[0];

  // 해당 슬라이드 찾기
  return allSlides.find((slide) => slide.id === firstCalleeId) || null;
}

/**
 * 여러 callers 중 선택해서 이동 (UI에서 사용)
 */
export function navigateToSpecificCaller(callerId: string, allSlides: Slide[]): Slide | null {
  return allSlides.find((slide) => slide.id === callerId) || null;
}

/**
 * 여러 callees 중 선택해서 이동 (UI에서 사용)
 */
export function navigateToSpecificCallee(calleeId: string, allSlides: Slide[]): Slide | null {
  return allSlides.find((slide) => slide.id === calleeId) || null;
}
