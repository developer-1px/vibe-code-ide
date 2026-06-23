import type { RefObject } from 'react';
import type { CanvasNode } from '@/entities/CanvasNode/model/types.ts';
import { CanvasCodeCard } from './CanvasCodeCard.tsx';
import CanvasConnections from './CanvasConnections.tsx';
import D3ZoomContainer from './D3ZoomContainer.tsx';

interface CanvasStageProps {
  containerRef: RefObject<HTMLDivElement | null>;
  layoutNodes: CanvasNode[];
}

export function CanvasStage({ containerRef, layoutNodes }: CanvasStageProps) {
  return (
    <D3ZoomContainer containerRef={containerRef}>
      <CanvasConnections />
      {layoutNodes.map((node) => (
        <CanvasCodeCard key={node.visualId} node={node} />
      ))}
    </D3ZoomContainer>
  );
}
