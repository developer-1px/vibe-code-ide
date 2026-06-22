import type { CodeLine } from '@/entities/CodeLine/model/types';
import type { SourceFileNode } from '@/entities/SourceFileNode/model/types';
import type { Slide, SlideContext } from '../model/types';

/**
 * fullNodeMap에서 함수 노드들만 추출
 */
export function extractFunctionNodes(fullNodeMap: Map<string, SourceFileNode>): SourceFileNode[] {
  return Array.from(fullNodeMap.values()).filter((node) => node.type === 'function' || node.type === 'const');
}

/**
 * 함수 노드의 코드를 CodeLine[]로 변환 (간단한 버전)
 */
function convertToCodeLines(codeSnippet: string, startLine: number): CodeLine[] {
  const lines = codeSnippet.split('\n');

  return lines.map((text, index) => ({
    num: startLine + index,
    segments: [
      {
        text,
        kinds: ['text'],
      },
    ],
    hasInput: false,
  }));
}

/**
 * fullNodeMap에서 caller들 찾기
 * (이 함수를 dependencies에 포함하고 있는 노드들)
 */
function findCallers(targetNodeId: string, fullNodeMap: Map<string, SourceFileNode>): string[] {
  const callers: string[] = [];

  for (const [nodeId, node] of fullNodeMap) {
    if (node.dependencies?.includes(targetNodeId)) {
      callers.push(nodeId);
    }
  }

  return callers;
}

/**
 * 같은 파일의 다른 함수들 찾기 (siblings)
 */
function findSiblings(targetNode: SourceFileNode, fullNodeMap: Map<string, SourceFileNode>): string[] {
  const siblings: string[] = [];

  for (const [nodeId, node] of fullNodeMap) {
    // 자기 자신은 제외
    if (nodeId === targetNode.id) continue;

    // 같은 파일의 함수/const만
    if (node.filePath === targetNode.filePath && (node.type === 'function' || node.type === 'const')) {
      siblings.push(nodeId);
    }
  }

  // startLine 기준으로 정렬
  siblings.sort((a, b) => {
    const nodeA = fullNodeMap.get(a);
    const nodeB = fullNodeMap.get(b);
    if (!nodeA || !nodeB) return 0;
    return nodeA.startLine - nodeB.startLine;
  });

  return siblings;
}

/**
 * 함수 노드를 Slide로 변환
 */
export function buildSlide(functionNode: SourceFileNode, fullNodeMap: Map<string, SourceFileNode>): Slide {
  // 코드를 CodeLine[]로 변환
  const codeLines = convertToCodeLines(functionNode.codeSnippet, functionNode.startLine);

  // 함수 이름 추출 (id에서 ::functionName 형식)
  const functionName = functionNode.id.includes('::')
    ? functionNode.id.split('::').pop() || functionNode.label
    : functionNode.label;

  // Caller/Callee 계산
  const callers = findCallers(functionNode.id, fullNodeMap);
  const callees = functionNode.dependencies || [];

  // Siblings 계산
  const siblings = findSiblings(functionNode, fullNodeMap);

  // Context 생성
  const context: SlideContext = {
    filePath: functionNode.filePath,
    functionName,
    startLine: functionNode.startLine,
    endLine: functionNode.startLine + codeLines.length - 1,
    callers,
    callees,
    siblings,
  };

  // Slide 생성
  const slide: Slide = {
    id: functionNode.id,
    functionNode,
    codeLines,
    context,
    isPartial: false,
  };

  return slide;
}

/**
 * fullNodeMap에서 모든 슬라이드 생성
 */
export function buildSlides(fullNodeMap: Map<string, SourceFileNode>): Slide[] {
  const functionNodes = extractFunctionNodes(fullNodeMap);
  return functionNodes.map((node) => buildSlide(node, fullNodeMap));
}

/**
 * 특정 파일들의 함수만 슬라이드로 변환
 */
export function buildSlidesFromFiles(fullNodeMap: Map<string, SourceFileNode>, filePaths: string[]): Slide[] {
  const functionNodes = extractFunctionNodes(fullNodeMap).filter((node) => filePaths.includes(node.filePath));
  return functionNodes.map((node) => buildSlide(node, fullNodeMap));
}

/**
 * 슬라이드 ID로 슬라이드 찾기
 */
export function findSlideById(slides: Slide[], slideId: string): Slide | null {
  return slides.find((slide) => slide.id === slideId) || null;
}
