/**
 * DependencyTokenSegment - 의존성 토큰 렌더링
 * 외부 파일의 변수/함수를 클릭하면 해당 파일을 열고 정의 위치로 이동
 */

import React from 'react';
import { useAtomValue } from 'jotai';
import type { CodeSegment, SegmentStyle } from '../../core/types';
import type { CanvasNode } from '../../../../entities/CanvasNode/model/types';
import { fullNodeMapAtom } from '../../../../store/atoms';
import { useGotoDefinition } from '../../../../features/GotoDefinition/lib/useGotoDefinition';
import { getTokenStyle } from '../../../../entities/SourceFileNode/lib/styleUtils';

interface DependencyTokenSegmentProps {
  segment: CodeSegment;
  node: CanvasNode;
  style: SegmentStyle;
  lineHasFocusedVariable?: boolean;
  isFocused?: boolean;
}

export const DependencyTokenSegment: React.FC<DependencyTokenSegmentProps> = ({ segment, node, style, lineHasFocusedVariable, isFocused }) => {
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const { handleGotoDefinitionByLocation } = useGotoDefinition();

  const isLinkable = fullNodeMap.has(segment.nodeId!);
  const isComponent = /^[A-Z]/.test(segment.text);

  const handleClick = (e: React.MouseEvent) => {
    console.log('[DependencyTokenSegment] Clicked:', {
      text: segment.text,
      nodeId: segment.nodeId,
      definitionLocation: segment.definitionLocation,
      hasDefinitionLocation: !!segment.definitionLocation
    });

    e.stopPropagation();

    // definitionLocation이 있으면 해당 파일을 열고 정의 위치로 이동
    // 일반 클릭으로도 작동하도록 metaKey를 강제로 true로 설정
    if (segment.definitionLocation) {
      console.log('[DependencyTokenSegment] Has definitionLocation, calling handleGotoDefinitionByLocation');
      const handled = handleGotoDefinitionByLocation(
        { ...e, metaKey: true } as React.MouseEvent,
        segment.definitionLocation
      );
      console.log('[DependencyTokenSegment] handleGotoDefinitionByLocation returned:', handled);
      if (handled) return;
    } else {
      console.log('[DependencyTokenSegment] No definitionLocation found');
    }

    // Fallback: nodeId로 이동 (기존 동작)
    // TODO: 여기에 기존 CodeToken의 토글 로직 추가 가능
  };

  const className = isFocused
    ? `${style.className} bg-cyan-500/30 rounded`
    : style.className;

  return (
    <span
      className={`${className} inline-block px-0.5 rounded transition-all duration-200 select-text cursor-pointer border ${getTokenStyle(false, isComponent)}`}
      onClick={handleClick}
    >
      {segment.text}
    </span>
  );
};
