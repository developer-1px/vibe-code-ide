import type { Slide } from '../../../entities/Slide/model/types';
import SlideContent from './SlideContent';

export function SlideDeck({ slide }: { slide: Slide }) {
  return <SlideContent slide={slide} />;
}
