import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { filesAtom, graphDataAtom } from '@/entities/AppView/model/atoms';
import type { SourceFileNode } from '@/entities/SourceFileNode/model/types';
import CodeViewer from '@/features/Code/CodeViewer/CodeViewer';
import { renderCodeLinesDirect } from '@/features/Code/CodeViewer/core/renderer/renderCodeLinesDirect';
import type { Slide } from '../../entities/Slide/model/types';
import { extractChunks } from '../../features/SlideNavigation/lib/extractChunks';
import {
  chunkCountAtom,
  chunksAtom,
  currentChunkIndexAtom,
  targetDepthAtom,
} from '../../features/SlideNavigation/model/atoms';

/**
 * 슬라이드 콘텐츠 - 함수 코드 표시
 */
const SlideContent = ({ slide }: { slide: Slide }) => {
  const { context, functionNode } = slide;
  const files = useAtomValue(filesAtom);
  const graphData = useAtomValue(graphDataAtom);
  const currentChunkIndex = useAtomValue(currentChunkIndexAtom);
  const setChunkCount = useSetAtom(chunkCountAtom);
  const setChunks = useSetAtom(chunksAtom);
  const setTargetDepth = useSetAtom(targetDepthAtom);

  // 함수가 속한 파일 노드 찾기
  const fileNode = useMemo(() => {
    if (!graphData?.nodes) return null;

    return graphData.nodes.find((node) => node.filePath === context.filePath && node.type === 'file') as
      | SourceFileNode
      | undefined;
  }, [graphData, context.filePath]);

  // 전체 파일을 렌더링하고 함수 범위만 필터링
  const processedLines = useMemo(() => {
    if (!fileNode) return [];

    // 전체 파일을 CodeLine[]으로 렌더링
    const allLines = renderCodeLinesDirect(fileNode, files);

    // 함수의 startLine ~ endLine만 필터링
    return allLines.filter((line) => line.num >= context.startLine && line.num <= context.endLine);
  }, [fileNode, files, context.startLine, context.endLine]);

  // chunk 정보 추출 (주석 + fold 기반)
  const chunks = useMemo(() => {
    console.log(
      '[SlideContent] processedLines sample (first 20):',
      processedLines.slice(0, 20).map((line) => ({
        num: line.num,
        isComment: line.isComment,
        isBlankLine: line.isBlankLine,
        hasFold: !!line.foldInfo?.isFoldable,
        foldDepth: line.foldInfo?.depth,
        text: line.segments
          .map((s) => s.text)
          .join('')
          .slice(0, 50),
      }))
    );
    return extractChunks(processedLines);
  }, [processedLines]);

  // chunk 개수와 정보를 atom에 설정
  useEffect(() => {
    setChunkCount(chunks.length);
    setChunks(chunks);
    // 초기 targetDepth 설정 (첫 chunk의 depth)
    if (chunks.length > 0) {
      setTargetDepth(chunks[0].depth);
    }
  }, [chunks, setChunkCount, setChunks, setTargetDepth]);

  // 현재 chunk 정보
  const currentChunk = useMemo(() => {
    if (currentChunkIndex < 0 || currentChunkIndex >= chunks.length) {
      return null;
    }
    return chunks[currentChunkIndex];
  }, [currentChunkIndex, chunks]);

  // 전체 함수 코드를 표시 (fold 범위로 자르지 않음)
  const displayLines = processedLines;

  // 현재 chunk 외의 라인들을 mute 처리
  const mutedLines = useMemo(() => {
    if (!currentChunk) return new Set<number>();

    const muted = new Set<number>();
    processedLines.forEach((line) => {
      // 현재 chunk 범위 외의 라인만 mute
      if (line.num < currentChunk.chunkStart || line.num > currentChunk.chunkEnd) {
        muted.add(line.num);
      }
    });
    return muted;
  }, [currentChunk, processedLines]);

  // 현재 chunk의 시작 라인을 highlight
  const highlightedLines = useMemo(() => {
    if (!currentChunk) return new Set<number>();
    return new Set<number>([currentChunk.lineNum]);
  }, [currentChunk]);

  // 현재 chunk로 자동 스크롤
  useEffect(() => {
    if (!currentChunk) return;

    // data-line-num 속성으로 해당 라인 찾기
    const lineElement = document.querySelector(`[data-line-num="${currentChunk.lineNum}"]`);
    if (lineElement) {
      lineElement.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  }, [currentChunk]);

  return (
    <div className="flex flex-col h-full bg-bg-base border border-border-DEFAULT rounded-lg overflow-hidden">
      {/* 헤더 - 함수 정보 */}
      <div className="flex items-center justify-between px-4 py-3 bg-bg-elevated border-b border-border-DEFAULT">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-text-primary">{context.functionName}</div>
          <div className="text-xs text-text-tertiary">
            {context.filePath}:{context.startLine}
          </div>
        </div>

        {/* chunk 정보 표시 */}
        {currentChunk ? (
          <div className="text-xs text-text-tertiary">
            Chunk {currentChunkIndex + 1}/{chunks.length} (Line {currentChunk.chunkStart}-{currentChunk.chunkEnd}
            {currentChunk.hasComment && ' • Comment'})
          </div>
        ) : (
          <div className="text-xs text-text-tertiary">Full View ({chunks.length} chunks)</div>
        )}
      </div>

      {/* 코드 영역 - CodeViewer 사용 */}
      <div className="flex-1 overflow-auto">
        {displayLines.length > 0 ? (
          <CodeViewer
            processedLines={displayLines}
            node={functionNode}
            highlightedLines={highlightedLines}
            mutedLines={mutedLines}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-tertiary text-sm">No code available</div>
        )}
      </div>
    </div>
  );
};

export default SlideContent;
