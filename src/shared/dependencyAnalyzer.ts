/**
 * Dependency Analyzer - 파일 의존성 재귀 분석 및 토폴로지 정렬
 *
 * 알고리즘: DFS로 의존성 수집 → Kahn's algorithm으로 토폴로지 정렬
 * 정렬 순서: 리프 노드 (의존성 없음) → 루트 노드 (현재 파일) 순서
 */

import { getExports, getImports } from '../entities/SourceFileNode/lib/metadata';
import type { GraphData, SourceFileNode } from '../entities/SourceFileNode/model/types';
import { resolvePath } from './tsParser/utils/pathResolver';

export interface DependencyItem {
  filePath: string;
  depth: number; // 현재 파일로부터의 깊이 (0 = 현재 파일)
  isNpm: boolean; // NPM 모듈 여부
  directImporter?: string; // 이 파일을 직접 import한 파일 경로
  exportName?: string; // Entity 이름 (type/interface의 경우)
  kind?: 'type' | 'interface' | 'file'; // 항목 종류
  line?: number; // 선언 위치 (line number)
  isDirectlyUsed?: boolean; // 현재 파일에서 직접 사용 여부 (entities only)
}

export interface DependencyResults {
  localFiles: DependencyItem[]; // 로컬 파일들 (토폴로지 정렬됨)
  npmModules: DependencyItem[]; // NPM 모듈들
  entities: DependencyItem[]; // Type/Interface 선언들
  importedBy: DependencyItem[]; // 이 파일을 직접 import하는 파일들 (역방향 의존성, Direct)
  importedByIndirect: DependencyItem[]; // 재귀적으로 영향받는 파일들 (Indirect)
}

/**
 * 현재 파일의 모든 의존성을 재귀적으로 분석하고 토폴로지 정렬
 */
export function analyzeDependencies(currentFilePath: string | null, graphData: GraphData | null): DependencyResults {
  const results: DependencyResults = {
    localFiles: [],
    npmModules: [],
    entities: [],
    importedBy: [],
    importedByIndirect: [],
  };

  if (!currentFilePath || !graphData) {
    return results;
  }

  // 현재 파일 노드 찾기
  const currentNode = graphData.nodes.find((n) => n.filePath === currentFilePath);
  if (!currentNode) {
    console.warn('[dependencyAnalyzer] Current file not found:', currentFilePath);
    return results;
  }

  // Phase 0: 현재 파일에서 직접 import한 타입 이름 수집
  const currentImports = getImports(currentNode);
  const directlyUsedTypes = new Set<string>(); // 직접 import한 타입 이름들

  currentImports.forEach((imp) => {
    // import한 이름을 저장 (나중에 매칭할 때 사용)
    directlyUsedTypes.add(imp.name);
  });

  // Phase 0.5: 현재 파일에 정의된 타입들 수집 (This File)
  const currentExports = getExports(currentNode);
  const currentTypeExports = currentExports.filter((exp) => exp.kind === 'type' || exp.kind === 'interface');

  // Phase 0.6: files Record 생성 (resolvePath용)
  const files: Record<string, string> = {};
  graphData.nodes.forEach((node) => {
    files[node.filePath] = node.codeSnippet || '';
  });

  // Phase 1: DFS로 모든 의존성 수집
  const visited = new Set<string>();
  const localDeps = new Map<string, DependencyItem>(); // filePath → DependencyItem
  const npmDeps = new Map<string, DependencyItem>(); // moduleName → DependencyItem
  const entities = new Map<string, DependencyItem>(); // entityKey → DependencyItem (type/interface)
  const adjacencyList = new Map<string, Set<string>>(); // filePath → dependencies
  const indegree = new Map<string, number>(); // filePath → incoming edge count

  // 현재 파일의 타입들을 entities에 추가 (depth=0, isDirectlyUsed=true)
  currentTypeExports.forEach((typeExp) => {
    const entityKey = `${currentNode.filePath}#${typeExp.name}`;
    entities.set(entityKey, {
      filePath: currentNode.filePath,
      exportName: typeExp.name,
      kind: typeExp.kind,
      line: typeExp.line,
      depth: 0,
      isNpm: false,
      directImporter: null,
      isDirectlyUsed: true, // 현재 파일에 정의된 것 = 직접 사용
    });
  });

  function dfs(node: SourceFileNode, depth: number, importer: string | null) {
    if (visited.has(node.filePath)) return;
    visited.add(node.filePath);

    const imports = getImports(node);

    // 🔥 재귀적 타입 수집: 방문하는 모든 로컬 파일의 import 타입들을 directlyUsedTypes에 추가
    // 현재 파일 + 모든 의존 파일들이 import한 타입 = 전체 모듈이 직접 사용하는 타입
    imports.forEach((imp) => {
      directlyUsedTypes.add(imp.name);
    });

    // Initialize adjacency list and indegree
    if (!adjacencyList.has(node.filePath)) {
      adjacencyList.set(node.filePath, new Set());
      indegree.set(node.filePath, 0);
    }

    // 🔥 Entity 추출: 이 파일의 type/interface export 수집
    const exports = getExports(node);
    const typeExports = exports.filter((exp) => exp.kind === 'type' || exp.kind === 'interface');

    typeExports.forEach((typeExp) => {
      const entityKey = `${node.filePath}#${typeExp.name}`; // 중복 방지용 unique key
      if (!entities.has(entityKey)) {
        // isDirectlyUsed 판별: 현재 파일 + 모든 의존 파일이 import한 타입인지 확인
        // directlyUsedTypes는 DFS로 방문한 모든 파일의 import 타입들을 포함
        const isDirectlyUsed = directlyUsedTypes.has(typeExp.name);

        entities.set(entityKey, {
          filePath: node.filePath,
          exportName: typeExp.name,
          kind: typeExp.kind,
          line: typeExp.line,
          depth: depth,
          isNpm: false,
          directImporter: importer,
          isDirectlyUsed: isDirectlyUsed,
        });
      }
    });

    imports.forEach((imp) => {
      // NPM 모듈 처리 (from이 상대경로, 절대경로, alias가 아닌 경우)
      const isNpmModule = !imp.from.startsWith('.') && !imp.from.startsWith('/') && !imp.from.startsWith('@/');

      if (isNpmModule) {
        // NPM 모듈
        if (!npmDeps.has(imp.from)) {
          npmDeps.set(imp.from, {
            filePath: imp.from,
            depth: depth + 1,
            isNpm: true,
            directImporter: node.filePath,
          });
        }
      } else {
        // 로컬 파일: resolvePath로 정확한 경로 해석
        const resolvedPath = resolvePath(node.filePath, imp.from, files);

        if (resolvedPath) {
          const depNode = graphData.nodes.find((n) => n.filePath === resolvedPath);

          if (depNode) {
            const depPath = depNode.filePath;

            // 의존성 그래프 구축
            adjacencyList.get(node.filePath)?.add(depPath);
            indegree.set(depPath, (indegree.get(depPath) || 0) + 1);

            // DependencyItem 추가
            if (!localDeps.has(depPath)) {
              localDeps.set(depPath, {
                filePath: depPath,
                depth: depth + 1,
                isNpm: false,
                directImporter: node.filePath,
              });

              // 재귀 탐색
              dfs(depNode, depth + 1, node.filePath);
            }
          }
        }
      }
    });
  }

  dfs(currentNode, 0, null);

  // Phase 1.5: 직접 import한 타입들을 전체 파일에서 검색
  directlyUsedTypes.forEach((typeName) => {
    // 모든 파일에서 이 타입을 export하는 파일 찾기
    graphData.nodes.forEach((searchNode) => {
      if (searchNode.filePath === currentFilePath) return; // 현재 파일 스킵

      const exports = getExports(searchNode);
      const matchingExport = exports.find(
        (exp) => (exp.kind === 'type' || exp.kind === 'interface') && exp.name === typeName
      );

      if (matchingExport) {
        const entityKey = `${searchNode.filePath}#${matchingExport.name}`;

        // 이미 추가되지 않은 경우에만 추가
        if (!entities.has(entityKey)) {
          entities.set(entityKey, {
            filePath: searchNode.filePath,
            exportName: matchingExport.name,
            kind: matchingExport.kind,
            line: matchingExport.line,
            depth: 1, // 직접 import이므로 depth=1
            isNpm: false,
            directImporter: currentFilePath,
            isDirectlyUsed: true, // 직접 import한 타입
          });
        } else {
          // 이미 존재하는 경우, isDirectlyUsed를 true로 업데이트
          const existing = entities.get(entityKey)!;
          if (!existing.isDirectlyUsed) {
            entities.set(entityKey, {
              ...existing,
              isDirectlyUsed: true,
            });
          }
        }
      }
    });
  });

  // Phase 2: Kahn's algorithm으로 토폴로지 정렬
  const sorted: string[] = [];
  const queue: string[] = [];

  // Indegree가 0인 노드들을 큐에 추가 (리프 노드)
  for (const [filePath, degree] of indegree.entries()) {
    if (degree === 0) {
      queue.push(filePath);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    // 현재 노드가 의존하는 노드들의 indegree 감소
    const deps = adjacencyList.get(current);
    if (deps) {
      for (const dep of deps) {
        const newIndegree = (indegree.get(dep) || 0) - 1;
        indegree.set(dep, newIndegree);
        if (newIndegree === 0) {
          queue.push(dep);
        }
      }
    }
  }

  // Phase 3: 정렬된 순서로 결과 생성
  results.localFiles = sorted
    .map((filePath) => localDeps.get(filePath))
    .filter((item): item is DependencyItem => item !== undefined);

  results.npmModules = Array.from(npmDeps.values());
  results.entities = Array.from(entities.values());

  // Phase 4: 역방향 의존성 수집 (이 파일을 import하는 파일들)
  // Step 1: Direct importers 수집
  const importedByList: DependencyItem[] = [];
  const importedByIndirectList: DependencyItem[] = [];

  // 파일경로 → 이 파일을 import하는 파일들 매핑 (역방향 그래프)
  const reverseGraph = new Map<string, Set<string>>();
  graphData.nodes.forEach((node) => {
    const imports = getImports(node);
    imports.forEach((imp) => {
      // NPM 모듈은 스킵
      const isNpmModule = !imp.from.startsWith('.') && !imp.from.startsWith('/') && !imp.from.startsWith('@/');
      if (isNpmModule) return;

      // resolvePath로 정확한 경로 해석
      const resolvedPath = resolvePath(node.filePath, imp.from, files);

      if (resolvedPath) {
        if (!reverseGraph.has(resolvedPath)) {
          reverseGraph.set(resolvedPath, new Set());
        }
        reverseGraph.get(resolvedPath)!.add(node.filePath);
      }
    });
  });

  // Direct importers
  const directImporters = reverseGraph.get(currentFilePath) || new Set();

  directImporters.forEach((filePath) => {
    importedByList.push({
      filePath,
      depth: 0,
      isNpm: false,
      directImporter: null,
      kind: 'file',
    });
  });

  // Step 2: BFS로 Indirect importers 수집
  const visitedIndirect = new Set<string>([currentFilePath]); // 현재 파일은 이미 방문 처리
  directImporters.forEach((path) => {
    visitedIndirect.add(path);
  }); // Direct도 방문 처리

  const bfsQueue: { filePath: string; depth: number }[] = [];
  // Direct importers를 시작점으로 큐에 추가
  directImporters.forEach((filePath) => {
    bfsQueue.push({ filePath, depth: 1 });
  });

  while (bfsQueue.length > 0) {
    const current = bfsQueue.shift()!;
    const importers = reverseGraph.get(current.filePath) || new Set();

    importers.forEach((importerPath) => {
      if (!visitedIndirect.has(importerPath)) {
        visitedIndirect.add(importerPath);
        importedByIndirectList.push({
          filePath: importerPath,
          depth: current.depth,
          isNpm: false,
          directImporter: current.filePath,
          kind: 'file',
        });
        bfsQueue.push({ filePath: importerPath, depth: current.depth + 1 });
      }
    });
  }

  results.importedBy = importedByList;
  results.importedByIndirect = importedByIndirectList;

  return results;
}
