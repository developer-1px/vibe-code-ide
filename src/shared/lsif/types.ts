/**
 * LSIF (Language Server Index Format) Types
 * Based on Microsoft LSIF Specification 0.4.0
 *
 * 핵심 개념:
 * - Vertex: 문서, 범위, 결과 등의 실체
 * - Edge: Vertex 간의 관계
 * - Index는 Graph Database 형태로 저장
 */

// ========================================
// Position & Range
// ========================================

export interface Position {
  line: number; // 0-based
  character: number; // 0-based
}

export interface Range {
  start: Position;
  end: Position;
}

// ========================================
// Vertex Types
// ========================================

export type VertexType = 'document' | 'range' | 'resultSet' | 'definitionResult' | 'hoverResult' | 'referenceResult';

/**
 * Document Vertex - 소스 파일
 */
export interface DocumentVertex {
  id: string; // 'doc:{filePath}'
  type: 'document';
  uri: string; // 파일 경로
  languageId: 'typescript' | 'javascript' | 'vue';
  contentHash: string; // 파일 변경 감지용 hash
}

/**
 * Range Vertex - 코드 범위 (symbol 위치)
 */
export interface RangeVertex {
  id: string; // 'range:{docId}:{line}:{char}'
  type: 'range';
  documentId: string; // 속한 문서 ID
  range: Range;
  tag?: {
    type: 'definition' | 'reference' | 'declaration';
    text: string; // Symbol name
    kind: 'function' | 'variable' | 'type' | 'interface' | 'class' | 'enum' | 'import';
  };
}

/**
 * ResultSet Vertex - 공통 정보를 저장하는 허브
 * 여러 Range가 같은 ResultSet을 가리킴 (메모리 절약)
 */
export interface ResultSetVertex {
  id: string; // 'rs:{docId}:{symbolName}'
  type: 'resultSet';
  documentId: string;
  symbolName: string; // export function name, type name 등
}

/**
 * DefinitionResult Vertex - "Go to Definition" 결과
 */
export interface DefinitionResultVertex {
  id: string; // 'defResult:{rsId}'
  type: 'definitionResult';
  result: {
    uri: string; // 정의된 파일
    range: Range; // 정의 위치
  };
}

/**
 * HoverResult Vertex - Hover tooltip 내용
 */
export interface HoverResultVertex {
  id: string; // 'hoverResult:{rsId}'
  type: 'hoverResult';
  result: {
    contents: string; // Markdown format
  };
}

/**
 * ReferenceResult Vertex - "Find All References" 결과
 */
export interface ReferenceResultVertex {
  id: string; // 'refResult:{rsId}'
  type: 'referenceResult';
  result: Array<{
    uri: string; // 참조하는 파일
    range: Range; // 참조 위치
  }>;
}

/**
 * Union type for all vertices
 */
export type Vertex =
  | DocumentVertex
  | RangeVertex
  | ResultSetVertex
  | DefinitionResultVertex
  | HoverResultVertex
  | ReferenceResultVertex;

// ========================================
// Edge Types
// ========================================

export type EdgeLabel =
  | 'contains' // Document → Range
  | 'next' // Range → ResultSet
  | 'textDocument/definition' // ResultSet → DefinitionResult
  | 'textDocument/hover' // ResultSet → HoverResult
  | 'textDocument/references' // ResultSet → ReferenceResult
  | 'item'; // ReferenceResult → Range (참조 추가)

export interface Edge {
  id: string; // 'edge:{outV}:{label}:{inV}'
  type: 'edge';
  label: EdgeLabel;
  outV: string; // Source vertex ID
  inV: string; // Target vertex ID
}

// ========================================
// IndexedDB Storage Types
// ========================================

/**
 * IndexedDB에 저장되는 Vertex 레코드
 */
export interface VertexRecord {
  id: string; // Primary key
  vertexType: VertexType;
  data: Vertex;
  documentId?: string; // Index용 (문서별 쿼리)
  symbolName?: string; // Index용 (symbol별 쿼리)
  createdAt: number;
  updatedAt: number;
}

/**
 * IndexedDB에 저장되는 Edge 레코드
 */
export interface EdgeRecord {
  id: string; // Primary key
  label: EdgeLabel;
  outV: string; // Index용
  inV: string; // Index용
  createdAt: number;
}

/**
 * IndexedDB에 저장되는 Document 인덱스
 * - 빠른 조회 및 변경 감지용
 */
export interface DocumentIndex {
  uri: string; // Primary key
  contentHash: string; // 파일 hash (변경 감지)
  vertexId: string; // Document vertex ID
  updatedAt: number;
}

// ========================================
// Utility Types
// ========================================

/**
 * LSIF Index 생성 결과
 */
export interface LSIFIndexResult {
  vertices: Vertex[];
  edges: Edge[];
  documentId: string;
}

/**
 * Export 정보 (Getter Layer 호환용)
 */
export interface ExportInfo {
  name: string;
  line: number; // 1-based
  kind: 'function' | 'variable' | 'type' | 'interface' | 'class' | 'enum';
}

/**
 * Import 정보 (Getter Layer 호환용)
 */
export interface ImportInfo {
  name: string;
  line: number; // 1-based
  from: string;
  isDefault: boolean;
  isNamespace: boolean;
}
