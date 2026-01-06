import type * as ts from 'typescript';
import type { ExportInfo, ImportInfo } from '../lib/metadata';

/**
 * SourceFileNode - TypeScript SourceFile 래퍼 또는 Symbol 노드
 *
 * 핵심 원칙:
 * - Worker 파싱 시점에 파일 노드 + Symbol 노드 모두 생성 (AST 순회 1번)
 * - 파일 노드: sourceFile 포함 (전체 AST) + View Map (미리 계산된 메타데이터)
 * - Symbol 노드: sourceFile 없음 (top-level type/interface/function 등)
 * - 검색/분석 단계에서 AST 재순회 금지 → View Map 조회
 */
export interface SourceFileNode {
  // 기본 식별자
  id: string; // 파일: filePath, Symbol: filePath::symbolName
  label: string; // 파일명 (확장자 제외) or 심볼명
  filePath: string; // 파일 경로
  type: 'file' | 'type' | 'interface' | 'function' | 'const' | 'variable' | 'class' | 'enum'; // 노드 타입

  // 원본 데이터
  codeSnippet: string; // 원본 코드
  startLine: number; // 시작 라인

  // TypeScript SourceFile (파일 노드만 포함)
  sourceFile?: ts.SourceFile; // Optional: Symbol 노드는 없음

  // 계산된 속성 (캐싱용)
  dependencies?: string[]; // getDependencies()로 계산

  // 🔥 NEW: View Map (CouchDB 스타일 - 미리 계산된 메타데이터)
  // Worker 파싱 시 1번 순회로 모든 View 생성 → AST 재순회 없이 조회만
  views?: {
    exports?: ExportInfo[]; // export 정보
    imports?: ImportInfo[]; // import 정보
    usages?: Record<string, string[]>; // symbolName → [importerFilePath]
    // 추가 View는 여기에 확장
  };

  // Vue 파일 지원
  vueTemplate?: string; // Vue 파일의 template 섹션
  vueTemplateRefs?: Array<any>; // Vue template에서 참조하는 변수/컴포넌트
}

export interface GraphData {
  nodes: SourceFileNode[];
}
