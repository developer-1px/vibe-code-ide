import type { CodeLine } from '@/entities/CodeLine/model/types';
import type { SourceFileNode } from '@/entities/SourceFileNode/model/types';

/**
 * Slide - PPT처럼 한 화면에 표시되는 함수 단위
 */
export interface Slide {
  /** 슬라이드 고유 ID (functionNode.id + partIndex) */
  id: string;

  /** 함수 노드 정보 */
  functionNode: SourceFileNode;

  /** 표시할 코드 라인들 (분할된 경우 일부만) */
  codeLines: CodeLine[];

  /** 슬라이드 컨텍스트 정보 */
  context: SlideContext;

  /** 긴 함수가 여러 슬라이드로 분할되었는지 */
  isPartial: boolean;

  /** 분할된 경우 몇 번째 파트인지 (0부터 시작) */
  partIndex?: number;

  /** 분할된 경우 전체 파트 개수 */
  totalParts?: number;
}

/**
 * SlideContext - 슬라이드의 컨텍스트 정보
 */
export interface SlideContext {
  /** 파일 경로 */
  filePath: string;

  /** 함수 이름 */
  functionName: string;

  /** 시작 라인 번호 */
  startLine: number;

  /** 끝 라인 번호 */
  endLine: number;

  /** 이 함수를 호출하는 함수들 (caller IDs) */
  callers: string[];

  /** 이 함수가 호출하는 함수들 (callee IDs) */
  callees: string[];

  /** 같은 파일의 다른 함수들 (sibling IDs) */
  siblings: string[];
}

/**
 * SlideNavigationDirection - 네비게이션 방향
 */
export type SlideNavigationDirection = 'up' | 'down' | 'left' | 'right';

/**
 * SlideNavigationResult - 네비게이션 결과
 */
export interface SlideNavigationResult {
  /** 다음 슬라이드 (없으면 null) */
  nextSlide: Slide | null;

  /** 네비게이션 실패 이유 */
  reason?: 'no-caller' | 'no-callee' | 'no-sibling' | 'boundary';
}
