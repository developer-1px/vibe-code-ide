/**
 * CanvasCodeCard - Canvas 내에서 위치를 가진 CodeCard 래퍼
 * 위치 계산 및 offset 적용을 담당
 */

import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import type { CanvasNode } from '../../entities/CanvasNode';
import CodeCard from '../CodeCard/CodeCard';
import { cardPositionsAtom } from '../../store/atoms';

interface CanvasCodeCardProps {
  node: CanvasNode;
}

export const CanvasCodeCard: React.FC<CanvasCodeCardProps> = ({ node }) => {
  const cardPositions = useAtomValue(cardPositionsAtom);
  const offset = cardPositions.get(node.id) || { x: 0, y: 0 };

  // GPU 가속을 위해 transform 사용 (left/top 대신)
  const style = useMemo(() => ({
    transform: `translate(${node.x + offset.x}px, ${node.y + offset.y}px)`,
    zIndex: 20
  }), [node.x, node.y, offset.x, offset.y]);

  return (
    <div
      className="absolute transition-transform duration-300 ease-out"
      style={style}
    >
      <CodeCard node={node} />
    </div>
  );
};
