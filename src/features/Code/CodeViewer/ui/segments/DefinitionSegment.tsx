/**
 * DefinitionSegment - Go to Definition 핸들러 (with hover tooltip)
 */

import type React from 'react';
import { useState } from 'react';
import type { CanvasNode } from '@/entities/CanvasNode/model/types';
import { useGotoDefinition } from '@/features/Code/CodeViewer/lib/useGotoDefinition';
import type { CodeSegment, SegmentStyle } from '@/features/Code/CodeViewer/model/segment';

interface DefinitionSegmentProps {
  segment: CodeSegment;
  node: CanvasNode;
  style: SegmentStyle;
}

export const DefinitionSegment: React.FC<DefinitionSegmentProps> = ({ segment, node, style }) => {
  const { handleGotoDefinitionByLocation } = useGotoDefinition();
  const [showTooltip, setShowTooltip] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();

    if (!segment.definitionLocation) return;

    // 일반 클릭도 정의로 이동 (DefinitionSegment는 항상 이동)
    // Cmd 키 없이도 동작하도록 강제 실행
    handleGotoDefinitionByLocation({ ...e, metaKey: true } as React.MouseEvent, segment.definitionLocation);
  }

  function handleMouseEnter() {
    setShowTooltip(true);
  }

  function handleMouseLeave() {
    setShowTooltip(false);
  }

  return (
    <span
      onClick={handleClick}
      onMouseEnter={style.hoverTooltip ? handleMouseEnter : undefined}
      onMouseLeave={style.hoverTooltip ? handleMouseLeave : undefined}
      className={style.className}
      title={style.title}
    >
      {segment.text}

      {/* Hover Tooltip */}
      {showTooltip && segment.hoverInfo && (
        <div className="absolute bottom-full left-0 mb-1 z-50 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200 whitespace-pre-wrap max-w-md shadow-lg pointer-events-none">
          <code className="font-mono text-2xs">{segment.hoverInfo}</code>
        </div>
      )}
    </span>
  );
};
