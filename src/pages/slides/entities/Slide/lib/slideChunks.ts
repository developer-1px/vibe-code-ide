/**
 * Chunk 추출 로직 - 주석 + Fold 기반
 *
 * Chunk 분리 규칙:
 * 1. 주석 블록 + fold: 연속된 주석 블록(빈 줄 나올 때까지) + 바로 아래 fold = 하나의 chunk
 * 2. fold만: 주석 없는 fold = 하나의 chunk
 * 3. fold와 fold 사이: 주석이 있든 없든 fold 끝~다음 fold 시작 전까지 = 하나의 chunk
 */

import type { CodeLine } from '@/entities/CodeLine/model/types';
import type { SlideChunk } from '../model/types';

/**
 * 연속된 주석 블록 찾기 (빈 줄이 나올 때까지)
 * Returns array indices, not line numbers!
 */
function findCommentBlock(
  lines: CodeLine[],
  startIdx: number
): { startIdx: number; endIdx: number; startLine: number; endLine: number } | null {
  if (!lines[startIdx]?.isComment) return null;

  let endIdx = startIdx;
  while (endIdx < lines.length) {
    const line = lines[endIdx];
    if (line.isBlankLine) break; // 빈 줄이 나오면 주석 블록 끝
    if (!line.isComment) break; // 주석이 아니면 끝
    endIdx++;
  }

  return {
    startIdx,
    endIdx: endIdx - 1,
    startLine: lines[startIdx].num,
    endLine: lines[endIdx - 1].num,
  };
}

/**
 * 주석 + Fold 기반 Chunk 추출
 */
export function extractSlideChunks(processedLines: CodeLine[]): SlideChunk[] {
  const chunks: SlideChunk[] = [];
  let i = 0;

  while (i < processedLines.length) {
    const line = processedLines[i];

    // 1. 빈 줄은 스킵
    if (line.isBlankLine) {
      i++;
      continue;
    }

    // 2. 주석 블록 발견
    if (line.isComment) {
      const commentBlock = findCommentBlock(processedLines, i);
      if (!commentBlock) {
        i++;
        continue;
      }

      // 주석 블록 다음 라인 찾기 (빈 줄 스킵)
      let nextIdx = commentBlock.endIdx + 1;
      while (nextIdx < processedLines.length && processedLines[nextIdx].isBlankLine) {
        nextIdx++;
      }

      // 주석 블록 바로 다음에 fold가 있는지 확인
      const nextLine = processedLines[nextIdx];
      if (nextLine?.foldInfo?.isFoldable) {
        // 주석 + fold를 하나의 chunk로
        const chunk = {
          lineNum: commentBlock.startLine,
          chunkStart: commentBlock.startLine,
          chunkEnd: nextLine.foldInfo.foldEnd,
          depth: nextLine.foldInfo.depth || 0,
          hasComment: true,
          commentStart: commentBlock.startLine,
          foldStart: nextLine.num,
          foldEnd: nextLine.foldInfo.foldEnd,
        };
        chunks.push(chunk);

        // 다음 fold 끝 이후 라인으로 이동
        i = processedLines.findIndex((l) => l.num > nextLine.foldInfo!.foldEnd);
        if (i === -1) {
          break;
        }
      } else {
        // 주석만 있는 경우 (fold 없음)
        const chunk = {
          lineNum: commentBlock.startLine,
          chunkStart: commentBlock.startLine,
          chunkEnd: commentBlock.endLine,
          depth: 0,
          hasComment: true,
          commentStart: commentBlock.startLine,
        };
        chunks.push(chunk);

        i = nextIdx;
      }
      continue;
    }

    // 3. fold 발견 (주석 없음)
    if (line.foldInfo?.isFoldable) {
      const chunk = {
        lineNum: line.num,
        chunkStart: line.num,
        chunkEnd: line.foldInfo.foldEnd,
        depth: line.foldInfo.depth || 0,
        hasComment: false,
        foldStart: line.num,
        foldEnd: line.foldInfo.foldEnd,
      };
      chunks.push(chunk);

      // 다음 fold 끝 이후 라인으로 이동
      i = processedLines.findIndex((l) => l.num > line.foldInfo!.foldEnd);
      if (i === -1) {
        break;
      }
      continue;
    }

    // 4. fold 사이의 코드 (주석 아님, fold 아님)
    // 다음 주석 또는 fold까지를 하나의 chunk로
    const chunkStartLine = line.num;
    let chunkEndLine = chunkStartLine;

    let j = i + 1;
    while (j < processedLines.length) {
      const nextLine = processedLines[j];

      // 주석이나 fold를 만나면 chunk 종료
      if (nextLine.isComment || nextLine.foldInfo?.isFoldable) {
        break;
      }

      if (!nextLine.isBlankLine) {
        chunkEndLine = nextLine.num;
      }
      j++;
    }

    // chunk가 의미 있는 코드를 포함하면 추가
    if (chunkEndLine >= chunkStartLine) {
      const chunk = {
        lineNum: chunkStartLine,
        chunkStart: chunkStartLine,
        chunkEnd: chunkEndLine,
        depth: 0,
        hasComment: false,
      };
      chunks.push(chunk);
    }

    i = j;
  }

  // line 번호순 정렬
  return chunks.sort((a, b) => a.lineNum - b.lineNum);
}

export function getCurrentSlideChunk(chunks: SlideChunk[], currentChunkIndex: number): SlideChunk | null {
  if (currentChunkIndex < 0 || currentChunkIndex >= chunks.length) {
    return null;
  }

  return chunks[currentChunkIndex];
}

export function getSlideMutedLines(processedLines: CodeLine[], currentChunk: SlideChunk | null): Set<number> {
  if (!currentChunk) return new Set<number>();

  const muted = new Set<number>();
  processedLines.forEach((line) => {
    if (line.num < currentChunk.chunkStart || line.num > currentChunk.chunkEnd) {
      muted.add(line.num);
    }
  });

  return muted;
}

export function getSlideHighlightedLines(currentChunk: SlideChunk | null): Set<number> {
  if (!currentChunk) return new Set<number>();
  return new Set<number>([currentChunk.lineNum]);
}
