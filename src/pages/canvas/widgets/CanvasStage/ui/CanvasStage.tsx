import type { ReactNode, RefObject } from 'react';
import type { CanvasNode } from '@/entities/CanvasNode/model/types.ts';
import { CanvasStage as CanvasStageContent } from '../../../features/CanvasStage/ui/CanvasStage.tsx';
import { CanvasInteractionLayer } from '../../../features/CanvasSurface/ui/CanvasInteractionLayer.tsx';

interface CanvasStageProps {
  containerRef: RefObject<HTMLDivElement | null>;
  layoutNodes: CanvasNode[];
  children?: ReactNode;
}

export function CanvasStage({ containerRef, layoutNodes, children }: CanvasStageProps) {
  return (
    <CanvasInteractionLayer containerRef={containerRef}>
      {children}
      <CanvasStageContent containerRef={containerRef} layoutNodes={layoutNodes} />
    </CanvasInteractionLayer>
  );
}
