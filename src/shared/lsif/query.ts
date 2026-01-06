/**
 * LSIF Query API - Graph Traversal
 *
 * LSIF Index를 쿼리하는 고수준 API
 * - followEdge: Edge를 따라 다음 Vertex로 이동
 * - textDocument/* : LSP 요청 시뮬레이션
 */

import {
  getVertex,
  queryVertices,
  getEdgesByOutV,
} from './IndexDB';
import type {
  Vertex,
  Edge,
  EdgeLabel,
  DocumentVertex,
  RangeVertex,
  ResultSetVertex,
  DefinitionResultVertex,
  HoverResultVertex,
  ReferenceResultVertex,
  Range,
  ExportInfo,
  ImportInfo,
} from './types';

// ========================================
// Graph Traversal
// ========================================

/**
 * Edge를 따라 다음 Vertex 조회
 * @param vertexId - 시작 Vertex ID
 * @param edgeLabel - 따라갈 Edge label
 * @returns 목적지 Vertex (없으면 null)
 */
export async function followEdge(
  vertexId: string,
  edgeLabel: EdgeLabel
): Promise<Vertex | null> {
  try {
    // 1. outV가 vertexId인 edge 찾기
    const edges = await getEdgesByOutV(vertexId, edgeLabel);

    if (edges.length === 0) return null;

    // 2. 첫 번째 edge의 inV vertex 조회
    const edge = edges[0];
    const targetVertex = await getVertex(edge.inV);

    return targetVertex;
  } catch (error) {
    console.error('[LSIF Query] Error following edge:', error);
    return null;
  }
}

/**
 * 여러 Edge를 따라 모든 목적지 Vertex 조회
 */
export async function followEdges(
  vertexId: string,
  edgeLabel: EdgeLabel
): Promise<Vertex[]> {
  try {
    const edges = await getEdgesByOutV(vertexId, edgeLabel);

    if (edges.length === 0) return [];

    const vertices: Vertex[] = [];
    for (const edge of edges) {
      const vertex = await getVertex(edge.inV);
      if (vertex) {
        vertices.push(vertex);
      }
    }

    return vertices;
  } catch (error) {
    console.error('[LSIF Query] Error following edges:', error);
    return [];
  }
}

// ========================================
// LSP Request Simulation
// ========================================

/**
 * textDocument/definition - "Go to Definition"
 * @param uri - 파일 경로
 * @param position - 커서 위치
 * @returns 정의 위치
 */
export async function textDocumentDefinition(
  uri: string,
  position: { line: number; character: number }
): Promise<{ uri: string; range: Range } | null> {
  try {
    // 1. Document vertex 조회
    const docId = `doc:${uri}`;
    const docVertex = await getVertex(docId) as DocumentVertex | null;

    if (!docVertex) return null;

    // 2. 해당 위치의 Range vertex 찾기
    const ranges = await queryVertices('range', { documentId: docId });
    const targetRange = ranges.find((v) => {
      const r = v as RangeVertex;
      return isPositionInRange(position, r.range);
    }) as RangeVertex | undefined;

    if (!targetRange) return null;

    // 3. Range → ResultSet → DefinitionResult
    const resultSet = await followEdge(targetRange.id, 'next') as ResultSetVertex | null;
    if (!resultSet) return null;

    const defResult = await followEdge(
      resultSet.id,
      'textDocument/definition'
    ) as DefinitionResultVertex | null;

    if (!defResult) return null;

    return defResult.result;
  } catch (error) {
    console.error('[LSIF Query] Error in textDocument/definition:', error);
    return null;
  }
}

/**
 * textDocument/hover - Hover tooltip
 */
export async function textDocumentHover(
  uri: string,
  position: { line: number; character: number }
): Promise<{ contents: string } | null> {
  try {
    const docId = `doc:${uri}`;
    const ranges = await queryVertices('range', { documentId: docId });
    const targetRange = ranges.find((v) => {
      const r = v as RangeVertex;
      return isPositionInRange(position, r.range);
    }) as RangeVertex | undefined;

    if (!targetRange) return null;

    const resultSet = await followEdge(targetRange.id, 'next') as ResultSetVertex | null;
    if (!resultSet) return null;

    const hoverResult = await followEdge(
      resultSet.id,
      'textDocument/hover'
    ) as HoverResultVertex | null;

    if (!hoverResult) return null;

    return hoverResult.result;
  } catch (error) {
    console.error('[LSIF Query] Error in textDocument/hover:', error);
    return null;
  }
}

/**
 * textDocument/references - "Find All References"
 */
export async function textDocumentReferences(
  uri: string,
  position: { line: number; character: number }
): Promise<Array<{ uri: string; range: Range }>> {
  try {
    const docId = `doc:${uri}`;
    const ranges = await queryVertices('range', { documentId: docId });
    const targetRange = ranges.find((v) => {
      const r = v as RangeVertex;
      return isPositionInRange(position, r.range);
    }) as RangeVertex | undefined;

    if (!targetRange) return [];

    const resultSet = await followEdge(targetRange.id, 'next') as ResultSetVertex | null;
    if (!resultSet) return [];

    const refResult = await followEdge(
      resultSet.id,
      'textDocument/references'
    ) as ReferenceResultVertex | null;

    if (!refResult) return [];

    return refResult.result;
  } catch (error) {
    console.error('[LSIF Query] Error in textDocument/references:', error);
    return [];
  }
}

// ========================================
// High-Level Queries (Getter Layer 호환)
// ========================================

/**
 * 파일의 모든 Export 정보 조회
 * @param uri - 파일 경로
 * @returns ExportInfo[]
 */
export async function getExportsFromLSIF(uri: string): Promise<ExportInfo[]> {
  try {
    const docId = `doc:${uri}`;

    // 1. Document의 Range vertices 조회 (tag: 'definition')
    const ranges = await queryVertices('range', { documentId: docId });
    const exportRanges = ranges.filter((v) => {
      const r = v as RangeVertex;
      return r.tag?.type === 'definition';
    }) as RangeVertex[];

    // 2. 각 Range에서 ExportInfo 추출
    const exports: ExportInfo[] = exportRanges.map((range) => ({
      name: range.tag?.text || '',
      line: range.range.start.line + 1, // 1-based
      kind: (range.tag?.kind as any) || 'variable',
    }));

    return exports;
  } catch (error) {
    console.error('[LSIF Query] Error getting exports:', error);
    return [];
  }
}

/**
 * 파일의 모든 Import 정보 조회
 */
export async function getImportsFromLSIF(uri: string): Promise<ImportInfo[]> {
  try {
    const docId = `doc:${uri}`;

    // Import tag가 있는 Range vertices 조회
    const ranges = await queryVertices('range', { documentId: docId });
    const importRanges = ranges.filter((v) => {
      const r = v as RangeVertex;
      return r.tag?.kind === 'import';
    }) as RangeVertex[];

    // ImportInfo 추출 (간단한 버전)
    const imports: ImportInfo[] = importRanges.map((range) => ({
      name: range.tag?.text || '',
      line: range.range.start.line + 1,
      from: '', // TODO: from 정보를 Range에 추가 필요
      isDefault: false,
      isNamespace: false,
    }));

    return imports;
  } catch (error) {
    console.error('[LSIF Query] Error getting imports:', error);
    return [];
  }
}

/**
 * Symbol의 사용처 조회
 * @param uri - 파일 경로
 * @param symbolName - Symbol 이름
 * @returns 사용하는 파일 경로 배열
 */
export async function getSymbolUsagesFromLSIF(
  uri: string,
  symbolName: string
): Promise<string[]> {
  try {
    const docId = `doc:${uri}`;
    const rsId = `rs:${docId}:${symbolName}`;

    // ResultSet vertex 조회
    const resultSet = await getVertex(rsId) as ResultSetVertex | null;
    if (!resultSet) return [];

    // ReferenceResult 조회
    const refResult = await followEdge(
      rsId,
      'textDocument/references'
    ) as ReferenceResultVertex | null;

    if (!refResult) return [];

    // 참조 파일 목록 추출
    const usages = refResult.result.map((ref) => ref.uri);
    return Array.from(new Set(usages)); // 중복 제거
  } catch (error) {
    console.error('[LSIF Query] Error getting symbol usages:', error);
    return [];
  }
}

// ========================================
// Utilities
// ========================================

/**
 * 위치가 Range 안에 있는지 확인
 */
function isPositionInRange(
  position: { line: number; character: number },
  range: Range
): boolean {
  // Line 비교
  if (position.line < range.start.line || position.line > range.end.line) {
    return false;
  }

  // 같은 라인이면 character 비교
  if (position.line === range.start.line && position.character < range.start.character) {
    return false;
  }
  if (position.line === range.end.line && position.character > range.end.character) {
    return false;
  }

  return true;
}

/**
 * 파일 content hash 계산 (간단한 djb2 hash)
 */
export function hashContent(content: string): string {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = (hash * 33) ^ content.charCodeAt(i);
  }
  return hash.toString(36);
}
