/**
 * CloseSegment - 카드 닫기 핸들러
 */

import { useAtomValue, useSetAtom } from 'jotai';
import type React from 'react';
import { fullNodeMapAtom } from '@/entities/AppView/model/atoms';
import type { CanvasNode } from '@/entities/CanvasNode/model/types';
import { visibleNodeIdsAtom } from '@/features/Canvas/model/atoms';
import type { CodeSegment, SegmentStyle } from '@/features/Code/CodeViewer/model/segment';
import { pruneDetachedNodes } from '@/pages/shared/features/Canvas/lib/pruneDetachedNodes';

interface CloseSegmentProps {
  segment: CodeSegment;
  node: CanvasNode;
  style: SegmentStyle;
}

export const CloseSegment: React.FC<CloseSegmentProps> = ({ segment, node, style }) => {
  const setVisibleNodeIds = useSetAtom(visibleNodeIdsAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setVisibleNodeIds((prev: Set<string>) => {
      const next = new Set(prev);
      next.delete(node.id);
      return pruneDetachedNodes(next, fullNodeMap, null, null);
    });
  }

  return (
    <span onClick={handleClick} className={style.className} title={style.title}>
      {segment.text}
    </span>
  );
};
