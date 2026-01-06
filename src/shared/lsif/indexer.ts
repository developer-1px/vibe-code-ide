/**
 * LSIF Indexer - AST to LSIF Graph Conversion
 *
 * TypeScript AST를 LSIF Vertex/Edge로 변환
 * - Export 선언 → Range + ResultSet + DefinitionResult + HoverResult
 * - Import 선언 → Range (tag: 'import')
 * - Symbol 참조 → ReferenceResult (나중에 2-pass로 수집)
 */

import * as ts from 'typescript';
import type {
  Vertex,
  Edge,
  DocumentVertex,
  RangeVertex,
  ResultSetVertex,
  DefinitionResultVertex,
  HoverResultVertex,
  ReferenceResultVertex,
  Range,
  LSIFIndexResult,
} from './types';
import { hashContent } from './query';

// ========================================
// Main Entry Point
// ========================================

/**
 * 파일 하나를 LSIF Index로 변환
 * @param filePath - 파일 경로
 * @param content - 파일 내용
 * @param sourceFile - TypeScript AST
 * @returns LSIF Vertices + Edges
 */
export function parseFileToLSIF(
  filePath: string,
  content: string,
  sourceFile: ts.SourceFile
): LSIFIndexResult {
  const vertices: Vertex[] = [];
  const edges: Edge[] = [];

  // 1. Document Vertex 생성
  const docId = `doc:${filePath}`;
  const docVertex: DocumentVertex = {
    id: docId,
    type: 'document',
    uri: filePath,
    languageId: getLanguageId(filePath),
    contentHash: hashContent(content),
  };
  vertices.push(docVertex);

  // 2. Export/Import Range 수집
  const exportRanges: RangeVertex[] = [];
  const importRanges: RangeVertex[] = [];

  ts.forEachChild(sourceFile, (node) => {
    // Export 선언 처리
    if (ts.isExportDeclaration(node) || hasExportModifier(node)) {
      const exportInfo = extractExportInfo(node, sourceFile, docId);
      if (exportInfo) {
        exportRanges.push(...exportInfo.ranges);
        vertices.push(...exportInfo.vertices);
        edges.push(...exportInfo.edges);
      }
    }

    // Import 선언 처리
    if (ts.isImportDeclaration(node)) {
      const importRange = extractImportRange(node, sourceFile, docId);
      if (importRange) {
        importRanges.push(importRange);
      }
    }
  });

  // 3. Range vertices 추가
  vertices.push(...exportRanges);
  vertices.push(...importRanges);

  // 4. Document → Range edges (contains)
  [...exportRanges, ...importRanges].forEach((range) => {
    edges.push(createEdge(docId, 'contains', range.id));
  });

  return { vertices, edges, documentId: docId };
}

// ========================================
// Export Processing
// ========================================

interface ExportInfo {
  ranges: RangeVertex[];
  vertices: Vertex[];
  edges: Edge[];
}

/**
 * Export 선언을 LSIF 구조로 변환
 * Export → Range → ResultSet → DefinitionResult + HoverResult
 */
function extractExportInfo(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  docId: string
): ExportInfo | null {
  const ranges: RangeVertex[] = [];
  const vertices: Vertex[] = [];
  const edges: Edge[] = [];

  // Export된 symbol 이름과 kind 추출
  const symbolInfo = getExportSymbolInfo(node, sourceFile);
  if (!symbolInfo) return null;

  const { name, kind, range } = symbolInfo;

  // 1. Range Vertex (정의 위치)
  const rangeId = `range:${docId}:${range.start.line}:${range.start.character}`;
  const rangeVertex: RangeVertex = {
    id: rangeId,
    type: 'range',
    documentId: docId,
    range,
    tag: {
      type: 'definition',
      text: name,
      kind,
    },
  };
  ranges.push(rangeVertex);

  // 2. ResultSet Vertex (공통 정보 허브)
  const rsId = `rs:${docId}:${name}`;
  const resultSetVertex: ResultSetVertex = {
    id: rsId,
    type: 'resultSet',
    documentId: docId,
    symbolName: name,
  };
  vertices.push(resultSetVertex);

  // 3. DefinitionResult Vertex
  const defResultId = `defResult:${rsId}`;
  const defResultVertex: DefinitionResultVertex = {
    id: defResultId,
    type: 'definitionResult',
    result: {
      uri: docId.replace('doc:', ''),
      range,
    },
  };
  vertices.push(defResultVertex);

  // 4. HoverResult Vertex (함수 시그니처)
  const hoverContent = extractHoverContent(node, sourceFile, name, kind);
  const hoverResultId = `hoverResult:${rsId}`;
  const hoverResultVertex: HoverResultVertex = {
    id: hoverResultId,
    type: 'hoverResult',
    result: {
      contents: hoverContent,
    },
  };
  vertices.push(hoverResultVertex);

  // 5. Edges 생성
  edges.push(createEdge(rangeId, 'next', rsId)); // Range → ResultSet
  edges.push(createEdge(rsId, 'textDocument/definition', defResultId)); // RS → DefinitionResult
  edges.push(createEdge(rsId, 'textDocument/hover', hoverResultId)); // RS → HoverResult

  return { ranges, vertices, edges };
}

/**
 * Export symbol 정보 추출
 */
function getExportSymbolInfo(
  node: ts.Node,
  sourceFile: ts.SourceFile
): { name: string; kind: RangeVertex['tag']['kind']; range: Range } | null {
  let name = '';
  let kind: RangeVertex['tag']['kind'] = 'variable';

  // Function Declaration
  if (ts.isFunctionDeclaration(node) && node.name) {
    name = node.name.text;
    kind = 'function';
  }
  // Variable Statement (const, let, var)
  else if (ts.isVariableStatement(node)) {
    const declaration = node.declarationList.declarations[0];
    if (ts.isIdentifier(declaration.name)) {
      name = declaration.name.text;
      kind = 'variable';
    }
  }
  // Type Alias
  else if (ts.isTypeAliasDeclaration(node)) {
    name = node.name.text;
    kind = 'type';
  }
  // Interface
  else if (ts.isInterfaceDeclaration(node)) {
    name = node.name.text;
    kind = 'interface';
  }
  // Class
  else if (ts.isClassDeclaration(node) && node.name) {
    name = node.name.text;
    kind = 'class';
  }
  // Enum
  else if (ts.isEnumDeclaration(node)) {
    name = node.name.text;
    kind = 'enum';
  }
  // Export Declaration (export { foo })
  else if (ts.isExportDeclaration(node)) {
    // TODO: ExportSpecifier 처리 필요
    return null;
  }

  if (!name) return null;

  const range = nodeToRange(node, sourceFile);
  return { name, kind, range };
}

/**
 * Hover tooltip content 생성
 */
function extractHoverContent(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  name: string,
  kind: RangeVertex['tag']['kind']
): string {
  // Function signature
  if (ts.isFunctionDeclaration(node)) {
    const params = node.parameters
      .map((p) => p.getText(sourceFile))
      .join(', ');
    const returnType = node.type ? `: ${node.type.getText(sourceFile)}` : '';
    return `\`\`\`typescript\nfunction ${name}(${params})${returnType}\n\`\`\``;
  }

  // Variable with type
  if (ts.isVariableStatement(node)) {
    const declaration = node.declarationList.declarations[0];
    const type = declaration.type
      ? `: ${declaration.type.getText(sourceFile)}`
      : '';
    return `\`\`\`typescript\nconst ${name}${type}\n\`\`\``;
  }

  // Type Alias
  if (ts.isTypeAliasDeclaration(node)) {
    return `\`\`\`typescript\ntype ${name} = ${node.type.getText(sourceFile)}\n\`\`\``;
  }

  // Interface
  if (ts.isInterfaceDeclaration(node)) {
    return `\`\`\`typescript\ninterface ${name}\n\`\`\``;
  }

  // Class
  if (ts.isClassDeclaration(node)) {
    return `\`\`\`typescript\nclass ${name}\n\`\`\``;
  }

  // Enum
  if (ts.isEnumDeclaration(node)) {
    return `\`\`\`typescript\nenum ${name}\n\`\`\``;
  }

  return `\`\`\`typescript\n${kind} ${name}\n\`\`\``;
}

// ========================================
// Import Processing
// ========================================

/**
 * Import 선언을 Range Vertex로 변환
 */
function extractImportRange(
  node: ts.ImportDeclaration,
  sourceFile: ts.SourceFile,
  docId: string
): RangeVertex | null {
  if (!node.importClause) return null;

  const { importClause } = node;
  const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;

  // Default import: import Foo from 'bar'
  if (importClause.name) {
    const name = importClause.name.text;
    const range = nodeToRange(importClause.name, sourceFile);
    const rangeId = `range:${docId}:${range.start.line}:${range.start.character}`;

    return {
      id: rangeId,
      type: 'range',
      documentId: docId,
      range,
      tag: {
        type: 'reference',
        text: name,
        kind: 'import',
      },
    };
  }

  // Named imports: import { foo, bar } from 'baz'
  if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
    const firstImport = importClause.namedBindings.elements[0];
    if (!firstImport) return null;

    const name = firstImport.name.text;
    const range = nodeToRange(firstImport, sourceFile);
    const rangeId = `range:${docId}:${range.start.line}:${range.start.character}`;

    return {
      id: rangeId,
      type: 'range',
      documentId: docId,
      range,
      tag: {
        type: 'reference',
        text: name,
        kind: 'import',
      },
    };
  }

  // Namespace import: import * as Foo from 'bar'
  if (
    importClause.namedBindings &&
    ts.isNamespaceImport(importClause.namedBindings)
  ) {
    const name = importClause.namedBindings.name.text;
    const range = nodeToRange(importClause.namedBindings, sourceFile);
    const rangeId = `range:${docId}:${range.start.line}:${range.start.character}`;

    return {
      id: rangeId,
      type: 'range',
      documentId: docId,
      range,
      tag: {
        type: 'reference',
        text: name,
        kind: 'import',
      },
    };
  }

  return null;
}

// ========================================
// Reference Processing (2-pass)
// ========================================

/**
 * 전체 프로젝트에서 cross-file reference 수집
 * @param allResults - 모든 파일의 LSIF 결과
 * @returns ReferenceResult vertices + item edges
 */
export function buildReferenceResults(
  allResults: LSIFIndexResult[]
): { vertices: ReferenceResultVertex[]; edges: Edge[] } {
  const vertices: ReferenceResultVertex[] = [];
  const edges: Edge[] = [];

  // 1. 모든 export symbol 수집 (docId → symbolName → Range)
  const exportMap = new Map<string, Map<string, Range>>();

  allResults.forEach((result) => {
    result.vertices.forEach((vertex) => {
      if (
        vertex.type === 'range' &&
        vertex.tag?.type === 'definition'
      ) {
        const docId = vertex.documentId;
        const symbolName = vertex.tag.text;

        if (!exportMap.has(docId)) {
          exportMap.set(docId, new Map());
        }
        exportMap.get(docId)!.set(symbolName, vertex.range);
      }
    });
  });

  // 2. 모든 import 수집 (어떤 symbol이 어디서 참조되는지)
  const referenceMap = new Map<
    string,
    Array<{ uri: string; range: Range }>
  >(); // key: rsId

  allResults.forEach((result) => {
    result.vertices.forEach((vertex) => {
      if (
        vertex.type === 'range' &&
        vertex.tag?.type === 'reference' &&
        vertex.tag.kind === 'import'
      ) {
        const importName = vertex.tag.text;
        const importerUri = vertex.documentId.replace('doc:', '');

        // TODO: import path를 resolve해서 실제 definition의 rsId 찾기
        // 현재는 간단하게 같은 이름으로 매칭 (나중에 개선 필요)
        allResults.forEach((targetResult) => {
          targetResult.vertices.forEach((targetVertex) => {
            if (
              targetVertex.type === 'resultSet' &&
              targetVertex.symbolName === importName
            ) {
              const rsId = targetVertex.id;

              if (!referenceMap.has(rsId)) {
                referenceMap.set(rsId, []);
              }
              referenceMap.get(rsId)!.push({
                uri: importerUri,
                range: vertex.range,
              });
            }
          });
        });
      }
    });
  });

  // 3. ReferenceResult Vertex 생성
  referenceMap.forEach((references, rsId) => {
    const refResultId = `refResult:${rsId}`;
    const refResultVertex: ReferenceResultVertex = {
      id: refResultId,
      type: 'referenceResult',
      result: references,
    };
    vertices.push(refResultVertex);

    // RS → ReferenceResult edge
    edges.push(createEdge(rsId, 'textDocument/references', refResultId));

    // ReferenceResult → Range edges (item)
    references.forEach((ref, index) => {
      const rangeId = `range:doc:${ref.uri}:${ref.range.start.line}:${ref.range.start.character}`;
      edges.push(createEdge(refResultId, 'item', rangeId));
    });
  });

  return { vertices, edges };
}

// ========================================
// Utilities
// ========================================

/**
 * AST Node를 LSIF Range로 변환
 */
function nodeToRange(node: ts.Node, sourceFile: ts.SourceFile): Range {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

  return {
    start: {
      line: start.line,
      character: start.character,
    },
    end: {
      line: end.line,
      character: end.character,
    },
  };
}

/**
 * Edge 생성 헬퍼
 */
function createEdge(
  outV: string,
  label: Edge['label'],
  inV: string
): Edge {
  return {
    id: `edge:${outV}:${label}:${inV}`,
    type: 'edge',
    label,
    outV,
    inV,
  };
}

/**
 * Node가 export modifier를 가지는지 확인
 */
function hasExportModifier(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  const modifiers = ts.getModifiers(node);
  if (!modifiers) return false;
  return modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

/**
 * 파일 확장자로 languageId 결정
 */
function getLanguageId(
  filePath: string
): 'typescript' | 'javascript' | 'vue' {
  if (filePath.endsWith('.vue')) return 'vue';
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
  return 'typescript';
}
