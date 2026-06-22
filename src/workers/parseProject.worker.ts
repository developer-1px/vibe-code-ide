/**
 * parseProject.worker.ts - Web Worker for Project Parsing
 *
 * 역할:
 * - 파일 파싱 (TypeScript AST 생성)
 * - Symbol 노드 생성 (type, interface, function, const, class, enum)
 * - Dependencies 추출
 * - 성능: AST 순회 1번으로 파일 + Symbol 노드 모두 생성
 */

import * as ts from 'typescript';
import { batchSave, saveDocumentIndex } from '../shared/lsif/IndexDB';
import { buildReferenceResults, parseFileToLSIF } from '../shared/lsif/indexer';
import type { DocumentIndex, LSIFIndexResult } from '../shared/lsif/types';

// Mock tsconfig.json paths (실제로는 tsconfig.json에서 읽어와야 하지만 웹 환경이므로 하드코딩)
const PATH_ALIASES: Record<string, string> = {
  '@/*': 'src/*',
};

// Worker 메시지 타입
interface ParseProjectRequest {
  type: 'parseProject';
  files: Record<string, string>;
}

interface ParseProjectResponse {
  type: 'result';
  nodes: SerializedSourceFileNode[];
  parseTime: number;
}

interface ParseProjectProgress {
  type: 'progress';
  current: number;
  total: number;
  currentFile: string;
}

// Export/Import 정보 타입 (metadata.ts와 동일)
interface ExportInfo {
  name: string;
  line: number;
  kind: 'function' | 'variable' | 'type' | 'interface' | 'class' | 'enum';
}

interface ImportInfo {
  name: string;
  line: number;
  from: string;
  isDefault: boolean;
  isNamespace: boolean;
}

// SourceFileNode 직렬화 타입 (sourceFile 제외)
interface SerializedSourceFileNode {
  id: string;
  label: string;
  filePath: string;
  type: string;
  codeSnippet: string;
  startLine: number;
  dependencies: string[];
  // 🔥 NEW: View Map
  views?: {
    exports?: ExportInfo[];
    imports?: ImportInfo[];
    usages?: Record<string, string[]>;
  };
}

/**
 * Vue 파일 확인
 */
function isVueFile(filePath: string): boolean {
  return filePath.endsWith('.vue');
}

/**
 * Vue 파일의 script 태그 추출
 */
function extractVueScript(content: string, filePath: string): string | null {
  // <script> 또는 <script setup> 태그 찾기
  const scriptMatch = content.match(/<script(?:\s+setup)?(?:\s+lang="ts")?[^>]*>([\s\S]*?)<\/script>/i);

  if (scriptMatch) {
    return scriptMatch[1];
  }

  console.warn(`[Worker] No <script> tag found in Vue file: ${filePath}`);
  return null;
}

/**
 * 확장자 자동 추가 헬퍼 함수
 */
function tryResolveWithExtensions(basePath: string, files: Record<string, string>): string | null {
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.vue', '/index.ts', '/index.tsx'];

  for (const ext of extensions) {
    const testPath = basePath + ext;
    if (files[testPath]) {
      return testPath;
    }
  }

  return null;
}

/**
 * Path Alias 해석 (tsconfig.json paths 기반)
 * @example
 * resolveAlias('@/features/File/...') → 'src/features/File/...'
 */
function resolveAlias(importPath: string): string | null {
  for (const [aliasPattern, targetPattern] of Object.entries(PATH_ALIASES)) {
    // aliasPattern: '@/*' → prefix: '@/', suffix: '/*'
    const prefix = aliasPattern.replace(/\/\*$/, '/');

    if (importPath.startsWith(prefix)) {
      // '@/features/File/...' → 'features/File/...'
      const pathWithoutPrefix = importPath.substring(prefix.length);

      // targetPattern: 'src/*' → 'src/'
      const target = targetPattern.replace(/\/\*$/, '/');

      // 'src/' + 'features/File/...' → 'src/features/File/...'
      return target + pathWithoutPrefix;
    }
  }

  return null;
}

/**
 * 경로 해석 (Path Alias 지원)
 * - Path Alias (@/ 등) → tsconfig paths 기반 변환
 * - 상대 경로 (./, ../)
 * - 나머지는 npm 모듈
 */
function resolvePath(from: string, to: string, files: Record<string, string>): string | null {
  // 1. Path Alias 처리 (tsconfig.json paths 반영)
  const aliasResolved = resolveAlias(to);
  if (aliasResolved) {
    return tryResolveWithExtensions(aliasResolved, files);
  }

  // 2. 상대 경로 처리
  if (to.startsWith('.')) {
    const fromDir = from.substring(0, from.lastIndexOf('/'));
    const resolved = to.startsWith('./') ? `${fromDir}/${to.substring(2)}` : `${fromDir}/${to}`;

    return tryResolveWithExtensions(resolved, files);
  }

  // 3. 나머지는 npm 모듈
  return null;
}

/**
 * Dependencies 추출 (import 문)
 */
function getDependencies(sourceFile: ts.SourceFile, filePath: string, files: Record<string, string>): string[] {
  const dependencies: string[] = [];

  sourceFile.statements.forEach((statement) => {
    if (
      ts.isImportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      // Type-only import 제외
      if (statement.importClause?.isTypeOnly) return;

      const source = statement.moduleSpecifier.text;
      const resolvedPath = resolvePath(filePath, source, files);

      if (resolvedPath && !dependencies.includes(resolvedPath)) {
        dependencies.push(resolvedPath);
      }
    }
  });

  return dependencies;
}

/**
 * Line number 계산
 */
function getLineNumber(sourceFile: ts.SourceFile, node: ts.Node): number {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  return line + 1; // 1-based
}

// ============================================
// 🔥 VIEW REGISTRY (CouchDB 스타일)
// ============================================

/**
 * View 함수 타입
 * - sourceFile을 1번 순회하여 특정 메타데이터 추출
 * - 여러 View를 등록하여 Single Pass Multi-View 구현
 */
type ViewFunction = (sourceFile: ts.SourceFile, filePath: string) => Record<string, any>;

/**
 * View Registry (확장 가능)
 * 새로운 분석 추가 시 여기에 View 함수만 등록하면 됨
 */
const VIEW_REGISTRY: Record<string, ViewFunction> = {
  /**
   * Export View: export 선언 정보 수집
   */
  exports: (sourceFile, _filePath) => {
    const exports: ExportInfo[] = [];

    sourceFile.statements.forEach((statement) => {
      const hasExport = statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

      if (!hasExport) return;

      // Function export
      if (ts.isFunctionDeclaration(statement) && statement.name) {
        exports.push({
          name: statement.name.text,
          line: getLineNumber(sourceFile, statement),
          kind: 'function',
        });
      }
      // Variable export (const/let/var)
      else if (ts.isVariableStatement(statement)) {
        statement.declarationList.declarations.forEach((decl) => {
          if (ts.isIdentifier(decl.name)) {
            const isConst = (statement.declarationList.flags & ts.NodeFlags.Const) !== 0;
            exports.push({
              name: decl.name.text,
              line: getLineNumber(sourceFile, decl),
              kind: isConst ? 'variable' : 'variable',
            });
          }
        });
      }
      // Type alias export
      else if (ts.isTypeAliasDeclaration(statement)) {
        exports.push({
          name: statement.name.text,
          line: getLineNumber(sourceFile, statement),
          kind: 'type',
        });
      }
      // Interface export
      else if (ts.isInterfaceDeclaration(statement)) {
        exports.push({
          name: statement.name.text,
          line: getLineNumber(sourceFile, statement),
          kind: 'interface',
        });
      }
      // Class export
      else if (ts.isClassDeclaration(statement) && statement.name) {
        exports.push({
          name: statement.name.text,
          line: getLineNumber(sourceFile, statement),
          kind: 'class',
        });
      }
      // Enum export
      else if (ts.isEnumDeclaration(statement)) {
        exports.push({
          name: statement.name.text,
          line: getLineNumber(sourceFile, statement),
          kind: 'enum',
        });
      }
    });

    return { exports };
  },

  /**
   * Import View: import 선언 정보 수집
   */
  imports: (sourceFile, _filePath) => {
    const imports: ImportInfo[] = [];

    sourceFile.statements.forEach((statement) => {
      if (!ts.isImportDeclaration(statement)) return;
      if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) return;

      const from = statement.moduleSpecifier.text;
      const line = getLineNumber(sourceFile, statement);

      // Default import
      if (statement.importClause?.name) {
        imports.push({
          name: statement.importClause.name.text,
          line,
          from,
          isDefault: true,
          isNamespace: false,
        });
      }

      // Named imports
      if (statement.importClause?.namedBindings) {
        if (ts.isNamedImports(statement.importClause.namedBindings)) {
          statement.importClause.namedBindings.elements.forEach((element) => {
            imports.push({
              name: element.name.text,
              line,
              from,
              isDefault: false,
              isNamespace: false,
            });
          });
        }
        // Namespace import
        else if (ts.isNamespaceImport(statement.importClause.namedBindings)) {
          imports.push({
            name: statement.importClause.namedBindings.name.text,
            line,
            from,
            isDefault: false,
            isNamespace: true,
          });
        }
      }
    });

    return { imports };
  },

  // 🔥 Usage View는 2차 패스에서 계산 (모든 파일의 imports 수집 후)
  // parseProjectInWorker() 내에서 별도로 처리
};

/**
 * Single Pass Multi-View 생성
 * - 1번 순회로 등록된 모든 View 실행
 * - 결과를 View Map으로 반환
 */
function createViews(sourceFile: ts.SourceFile, filePath: string): Record<string, any> {
  const views: Record<string, any> = {};

  // 🔥 등록된 모든 View 함수 실행 (1번 순회)
  for (const [_viewName, viewFn] of Object.entries(VIEW_REGISTRY)) {
    Object.assign(views, viewFn(sourceFile, filePath));
  }

  return views;
}

/**
 * Symbol 노드 추출 (type, interface, function, const, class, enum)
 * 🔥 Worker 파싱 시점에 1번만 실행 - AST 재순회 방지
 */
function extractSymbolNodes(sourceFile: ts.SourceFile, filePath: string, nodes: SerializedSourceFileNode[]): void {
  sourceFile.statements.forEach((statement) => {
    // Type alias
    if (ts.isTypeAliasDeclaration(statement)) {
      nodes.push({
        id: `${filePath}::${statement.name.text}`,
        label: statement.name.text,
        filePath,
        type: 'type',
        codeSnippet: statement.getText(sourceFile),
        startLine: getLineNumber(sourceFile, statement),
        dependencies: [],
      });
    }

    // Interface
    else if (ts.isInterfaceDeclaration(statement)) {
      nodes.push({
        id: `${filePath}::${statement.name.text}`,
        label: statement.name.text,
        filePath,
        type: 'interface',
        codeSnippet: statement.getText(sourceFile),
        startLine: getLineNumber(sourceFile, statement),
        dependencies: [],
      });
    }

    // Function
    else if (ts.isFunctionDeclaration(statement) && statement.name) {
      nodes.push({
        id: `${filePath}::${statement.name.text}`,
        label: statement.name.text,
        filePath,
        type: 'function',
        codeSnippet: statement.getText(sourceFile),
        startLine: getLineNumber(sourceFile, statement),
        dependencies: [],
      });
    }

    // Const/Variable (top-level only)
    else if (ts.isVariableStatement(statement)) {
      statement.declarationList.declarations.forEach((decl) => {
        if (ts.isIdentifier(decl.name)) {
          const isConst = (statement.declarationList.flags & ts.NodeFlags.Const) !== 0;
          nodes.push({
            id: `${filePath}::${decl.name.text}`,
            label: decl.name.text,
            filePath,
            type: isConst ? 'const' : 'variable',
            codeSnippet: decl.getText(sourceFile),
            startLine: getLineNumber(sourceFile, decl),
            dependencies: [],
          });
        }
      });
    }

    // Class
    else if (ts.isClassDeclaration(statement) && statement.name) {
      nodes.push({
        id: `${filePath}::${statement.name.text}`,
        label: statement.name.text,
        filePath,
        type: 'class',
        codeSnippet: statement.getText(sourceFile),
        startLine: getLineNumber(sourceFile, statement),
        dependencies: [],
      });
    }

    // Enum
    else if (ts.isEnumDeclaration(statement)) {
      nodes.push({
        id: `${filePath}::${statement.name.text}`,
        label: statement.name.text,
        filePath,
        type: 'enum',
        codeSnippet: statement.getText(sourceFile),
        startLine: getLineNumber(sourceFile, statement),
        dependencies: [],
      });
    }
  });
}

/**
 * 프로젝트 파싱 (Worker 내부)
 */
function parseProjectInWorker(files: Record<string, string>): SerializedSourceFileNode[] {
  const nodes: SerializedSourceFileNode[] = [];
  const filePathsArray = Object.keys(files);
  const totalFiles = filePathsArray.length;

  // 🔥 LSIF Index 수집용
  const lsifResults: LSIFIndexResult[] = [];

  filePathsArray.forEach((filePath, index) => {
    const content = files[filePath];
    if (!content) return;

    // .d.ts 파일 제외
    if (filePath.endsWith('.d.ts')) return;

    // 진행 상황 보고 (10% 단위)
    if (index % Math.max(1, Math.floor(totalFiles / 10)) === 0) {
      const progress: ParseProjectProgress = {
        type: 'progress',
        current: index + 1,
        total: totalFiles,
        currentFile: filePath,
      };
      self.postMessage(progress);
    }

    // 파일명 추출
    const fileName = filePath.split('/').pop() || filePath;
    const fileNameWithoutExt = fileName.replace(/\.(tsx?|jsx?|vue)$/, '');

    try {
      const scriptKind = filePath.endsWith('.tsx')
        ? ts.ScriptKind.TSX
        : filePath.endsWith('.jsx')
          ? ts.ScriptKind.JSX
          : filePath.endsWith('.vue')
            ? ts.ScriptKind.TS
            : ts.ScriptKind.TS;

      let parseContent = content;

      // Vue 파일이면 script 태그만 추출
      if (isVueFile(filePath)) {
        parseContent = extractVueScript(content, filePath) || '';
      }

      // TypeScript AST 생성
      const sourceFile = ts.createSourceFile(filePath, parseContent, ts.ScriptTarget.Latest, true, scriptKind);

      // Dependencies 추출
      const dependencies = getDependencies(sourceFile, filePath, files);

      // 🔥 3️⃣ View Map 생성 (Single Pass Multi-View)
      const views = createViews(sourceFile, filePath);

      // 🔥 4️⃣ LSIF Index 생성 (AST → Graph Database)
      try {
        const lsifIndex = parseFileToLSIF(filePath, content, sourceFile);
        lsifResults.push(lsifIndex);
        console.log(
          `[Worker] LSIF index created for ${filePath}: ${lsifIndex.vertices.length} vertices, ${lsifIndex.edges.length} edges`
        );
      } catch (lsifError) {
        console.error(`[Worker] LSIF indexing error for ${filePath}:`, lsifError);
      }

      // 1️⃣ 파일 노드 생성 (+ View Map 포함)
      nodes.push({
        id: filePath,
        label: fileNameWithoutExt,
        filePath,
        type: 'file',
        codeSnippet: content,
        startLine: 1,
        dependencies,
        views, // 🔥 미리 계산된 메타데이터
      });

      // 2️⃣ Symbol 노드 생성 (type, interface, function, const, class, enum)
      // 🔥 AST 순회 1번으로 모든 symbol 수집
      extractSymbolNodes(sourceFile, filePath, nodes);
    } catch (error) {
      console.error(`[Worker] Error parsing ${filePath}:`, error);
    }
  });

  // 🔥 4️⃣ Usage View 생성 (2차 패스 - 모든 imports 수집 후)
  // symbolName → [importerFilePath] 매핑
  const usageMap = new Map<string, Set<string>>(); // symbolName#filePath → Set<importerFilePath>

  nodes.forEach((node) => {
    if (node.type !== 'file' || !node.views?.imports) return;

    const imports = node.views.imports as ImportInfo[];
    const importerFilePath = node.filePath;

    imports.forEach((imp) => {
      const importedSymbolName = imp.name;

      // 이 symbol을 export하는 파일 찾기 (간단한 매칭 - from 경로 기반)
      // 실제로는 from을 해석해서 정확한 파일을 찾아야 하지만, 일단 symbol 이름으로 매칭
      nodes.forEach((candidateNode) => {
        if (candidateNode.type !== 'file' || !candidateNode.views?.exports) return;

        const exports = candidateNode.views.exports as ExportInfo[];
        const matchingExport = exports.find((exp) => exp.name === importedSymbolName);

        if (matchingExport) {
          const usageKey = `${importedSymbolName}#${candidateNode.filePath}`;
          if (!usageMap.has(usageKey)) {
            usageMap.set(usageKey, new Set());
          }
          usageMap.get(usageKey)?.add(importerFilePath);
        }
      });
    });
  });

  // 🔥 5️⃣ Usage View를 각 파일 노드에 추가
  nodes.forEach((node) => {
    if (node.type !== 'file' || !node.views?.exports) return;

    const exports = node.views.exports as ExportInfo[];
    const usages: Record<string, string[]> = {};

    exports.forEach((exp) => {
      const usageKey = `${exp.name}#${node.filePath}`;
      const importers = usageMap.get(usageKey);

      if (importers && importers.size > 0) {
        usages[exp.name] = Array.from(importers);
      }
    });

    // Usage View 추가
    if (Object.keys(usages).length > 0) {
      node.views!.usages = usages;
    }
  });

  // 🔥 6️⃣ LSIF Reference Results 생성 (cross-file references)
  console.log('[Worker] Building LSIF reference results...');
  const { vertices: refVertices, edges: refEdges } = buildReferenceResults(lsifResults);
  console.log(`[Worker] Built ${refVertices.length} reference results`);

  // 🔥 7️⃣ LSIF Index를 IndexedDB에 저장
  console.log('[Worker] Saving LSIF index to IndexedDB...');
  saveLSIFIndexes(lsifResults, refVertices, refEdges)
    .then(() => {
      console.log('[Worker] LSIF index saved successfully');
    })
    .catch((error) => {
      console.error('[Worker] Failed to save LSIF index:', error);
    });

  return nodes;
}

/**
 * LSIF Indexes를 IndexedDB에 저장
 */
async function saveLSIFIndexes(lsifResults: LSIFIndexResult[], refVertices: any[], refEdges: any[]): Promise<void> {
  try {
    // 1. 모든 vertices와 edges 수집
    const allVertices = lsifResults.flatMap((r) => r.vertices).concat(refVertices);
    const allEdges = lsifResults.flatMap((r) => r.edges).concat(refEdges);

    console.log(`[Worker] Batch saving ${allVertices.length} vertices, ${allEdges.length} edges...`);

    // 2. Batch save
    await batchSave(allVertices, allEdges);

    // 3. Document indexes 저장
    for (const result of lsifResults) {
      const docVertex = allVertices.find((v) => v.type === 'document' && v.id === result.documentId);

      if (docVertex && docVertex.type === 'document') {
        const docIndex: DocumentIndex = {
          uri: docVertex.uri,
          contentHash: docVertex.contentHash,
          vertexId: docVertex.id,
          updatedAt: Date.now(),
        };
        await saveDocumentIndex(docIndex);
      }
    }

    console.log('[Worker] LSIF indexes saved to IndexedDB');
  } catch (error) {
    console.error('[Worker] Error saving LSIF indexes:', error);
    throw error;
  }
}

function handleMessage(event: MessageEvent<ParseProjectRequest>) {
  const { type, files } = event.data;

  if (type === 'parseProject') {
    console.log(`[Worker] Starting project parsing: ${Object.keys(files).length} files`);
    const startTime = performance.now();

    try {
      const nodes = parseProjectInWorker(files);
      const parseTime = performance.now() - startTime;

      console.log(`[Worker] Project parsing complete: ${nodes.length} nodes in ${parseTime.toFixed(2)}ms`);

      const response: ParseProjectResponse = {
        type: 'result',
        nodes,
        parseTime,
      };

      self.postMessage(response);
    } catch (error) {
      console.error('[Worker] Project parse error:', error);
      // 에러 발생 시 빈 배열 반환
      self.postMessage({
        type: 'result',
        nodes: [],
        parseTime: 0,
      });
    }
  }
}

// Worker 메시지 핸들러
self.addEventListener('message', handleMessage);

console.log('[Worker] parseProject worker initialized');
