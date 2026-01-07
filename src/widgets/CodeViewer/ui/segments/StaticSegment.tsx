/**
 * StaticSegment - 클릭 불가능한 정적 텍스트
 * (keyword, punctuation, string, comment, text 등)
 */

import { useAtomValue, useSetAtom } from 'jotai';
import type React from 'react';
import { hoveredIdentifierAtom } from '@/entities/AppView/model/atoms';
import type { CodeSegment, SegmentStyle } from '../../core/types';

interface StaticSegmentProps {
  segment: CodeSegment;
  style: SegmentStyle;
  isFocused?: boolean;
}

// Identifier 종류인지 체크
const IDENTIFIER_KINDS = [
  'identifier',
  'local-variable',
  'parameter',
  'self',
  'external-import',
  'external-closure',
  'external-function',
];
const isIdentifierSegment = (segment: CodeSegment): boolean => {
  return segment.kinds?.some((kind) => IDENTIFIER_KINDS.includes(kind)) ?? false;
};

export const StaticSegment: React.FC<StaticSegmentProps> = ({ segment, style, isFocused }) => {
  const hoveredIdentifier = useAtomValue(hoveredIdentifierAtom);
  const setHoveredIdentifier = useSetAtom(hoveredIdentifierAtom);

  const isIdentifier = isIdentifierSegment(segment);
  const isHovered = isIdentifier && hoveredIdentifier === segment.text;

  const handleMouseEnter = () => {
    if (isIdentifier) {
      setHoveredIdentifier(segment.text);
    }
  };

  const handleMouseLeave = () => {
    if (isIdentifier) {
      setHoveredIdentifier(null);
    }
  };

  const className = isFocused
    ? `${style.className} bg-cyan-500/30 rounded`
    : isHovered
      ? `${style.className} bg-yellow-400/20 rounded`
      : style.className;

  return (
    <>
      {/* ✅ Inlay Hint (IntelliJ-style 파라미터 이름 표시) */}
      {segment.inlayHint && segment.inlayHint.position === 'before' && (
        <span className="text-[10px] bg-gray-500/10 text-gray-600 px-1 py-0.5 rounded mr-1 select-none pointer-events-none">
          {segment.inlayHint.text}
        </span>
      )}

      <span className={className} title={style.title} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {segment.text}
      </span>

      {/* Inlay Hint 'after' 위치 (나중에 확장용) */}
      {segment.inlayHint && segment.inlayHint.position === 'after' && (
        <span className="text-[10px] bg-gray-500/10 text-gray-600 px-1 py-0.5 rounded ml-1 select-none pointer-events-none">
          {segment.inlayHint.text}
        </span>
      )}
    </>
  );
};
