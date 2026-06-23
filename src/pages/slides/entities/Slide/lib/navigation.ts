import type { Slide } from '../model/types';

export function getSlideById(slideId: string, allSlides: Slide[]): Slide | null {
  return allSlides.find((slide) => slide.id === slideId) || null;
}

export function getSlideCaller(currentSlide: Slide, allSlides: Slide[]): Slide | null {
  const [firstCallerId] = currentSlide.context.callers;
  if (!firstCallerId) return null;

  return getSlideById(firstCallerId, allSlides);
}

export function getSlideCallee(currentSlide: Slide, allSlides: Slide[]): Slide | null {
  const [firstCalleeId] = currentSlide.context.callees;
  if (!firstCalleeId) return null;

  return getSlideById(firstCalleeId, allSlides);
}

export function getPreviousSlideSibling(currentSlide: Slide, allSlides: Slide[]): Slide | null {
  const currentIndex = currentSlide.context.siblings.indexOf(currentSlide.id);
  if (currentIndex <= 0) return null;

  return getSlideById(currentSlide.context.siblings[currentIndex - 1], allSlides);
}

export function getNextSlideSibling(currentSlide: Slide, allSlides: Slide[]): Slide | null {
  const currentIndex = currentSlide.context.siblings.indexOf(currentSlide.id);
  if (currentIndex === -1 || currentIndex >= currentSlide.context.siblings.length - 1) return null;

  return getSlideById(currentSlide.context.siblings[currentIndex + 1], allSlides);
}
