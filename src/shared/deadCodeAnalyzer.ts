/**
 * Dead Code Analyzer
 * TypeScript AST 기반 정적 분석으로 사용되지 않는 코드를 찾아냅니다
 *
 * 분석 항목:
 * - Unused Exports: export되었지만 다른 파일에서 import하지 않음
 * - Unused Imports: import했지만 파일 내에서 사용하지 않음
 * - Dead Functions: 선언되었지만 호출되지 않는 함수
 * - Unused Variables: 선언되었지만 참조되지 않는 변수
 *
 * 설계 패턴: Getter Layer
 * - AST 순회 로직은 entities/SourceFileNode/lib/metadata.ts에 집중
 * - 여기서는 getter 인터페이스만 사용
 * - 로컬 캐싱으로 성능 관리
 */

import type { SourceFileNode, GraphData } from '../entities/SourceFileNode/model/types';
import {
  getExports,
  getImports,
  getLocalFunctions,
  getLocalVariables,
  getUsedIdentifiers,
  getComponentProps,
  getFunctionArguments
} from '../entities/SourceFileNode/lib/metadata';

export interface DeadCodeItem {
  filePath: string;
  symbolName: string;
  line: number;
  kind: 'export' | 'import' | 'function' | 'variable' | 'prop' | 'argument';
  category: 'unusedExport' | 'unusedImport' | 'deadFunction' | 'unusedVariable' | 'unusedProp' | 'unusedArgument';
  from?: string; // import의 경우 from 경로
  componentName?: string; // prop의 경우 컴포넌트 이름
  functionName?: string; // argument의 경우 함수 이름
}

export interface DeadCodeResults {
  unusedExports: DeadCodeItem[];
  unusedImports: DeadCodeItem[];
  deadFunctions: DeadCodeItem[];
  unusedVariables: DeadCodeItem[];
  unusedProps: DeadCodeItem[];
  unusedArguments: DeadCodeItem[];
  totalCount: number;
}

/**
 * 프로젝트 전체의 dead code 분석
 *
 * Getter Layer 패턴 적용:
 * 1. type === 'file' 노드만 필터링
 * 2. Getter로 한 번만 메타데이터 추출 (로컬 캐싱)
 * 3. 캐싱된 데이터로 분석 (AST 순회 없음)
 */
export function analyzeDeadCode(graphData: GraphData | null): DeadCodeResults {
  const results: DeadCodeResults = {
    unusedExports: [],
    unusedImports: [],
    deadFunctions: [],
    unusedVariables: [],
    unusedProps: [],
    unusedArguments: [],
    totalCount: 0,
  };

  if (!graphData || graphData.nodes.length === 0) {
    return results;
  }

  // ✅ type === 'file' 노드만 사용 (snippet 노드 제외)
  const fileNodes = graphData.nodes.filter(node => node.type === 'file');

  if (fileNodes.length === 0) {
    console.warn('[deadCodeAnalyzer] No file nodes found');
    return results;
  }

  // ✅ 1. Getter로 한 번만 메타데이터 추출 (로컬 캐싱)
  const fileMetadataList = fileNodes.map(node => ({
    node,
    exports: getExports(node),
    imports: getImports(node),
    localFunctions: getLocalFunctions(node),
    localVariables: getLocalVariables(node),
    usedIdentifiers: getUsedIdentifiers(node),
    componentProps: getComponentProps(node),
    functionArguments: getFunctionArguments(node)
  }));

  // ✅ 2. 캐싱된 데이터로 분석 (AST 순회 없음)

  // 2-1. Unused Exports 분석
  fileMetadataList.forEach(({ node, exports, usedIdentifiers }) => {
    exports.forEach(exp => {
      // 1. 같은 파일 내에서 사용되는지 체크
      const isUsedInSameFile = usedIdentifiers.has(exp.name);

      // 2. 다른 파일에서 import하는지 체크
      const isImportedByOtherFile = fileMetadataList.some(other => {
        if (other.node.filePath === node.filePath) return false; // Skip self

        return other.imports.some(imp => {
          // Symbol 이름이 일치하고
          if (imp.name !== exp.name) return false;

          // Import 경로가 이 파일을 가리키는지 확인
          // 간단한 체크: 파일명이 from 경로에 포함되는지
          const fileName = node.filePath.split('/').pop()?.replace(/\.(tsx?|jsx?|vue)$/, '') || '';
          return imp.from.includes(fileName);
        });
      });

      // 같은 파일에서도 사용 안 하고, 다른 파일에서도 import 안 하면 unused
      if (!isUsedInSameFile && !isImportedByOtherFile) {
        results.unusedExports.push({
          filePath: node.filePath,
          symbolName: exp.name,
          line: exp.line,
          kind: 'export',
          category: 'unusedExport',
        });
      }
    });
  });

  // 2-2. Unused Imports 분석
  fileMetadataList.forEach(({ node, imports, usedIdentifiers }) => {
    imports.forEach(imp => {
      if (!usedIdentifiers.has(imp.name)) {
        results.unusedImports.push({
          filePath: node.filePath,
          symbolName: imp.name,
          line: imp.line,
          kind: 'import',
          category: 'unusedImport',
          from: imp.from,
        });
      }
    });
  });

  // 2-3. Dead Functions 분석
  fileMetadataList.forEach(({ node, localFunctions, usedIdentifiers }) => {
    localFunctions.forEach(func => {
      if (!usedIdentifiers.has(func.name)) {
        results.deadFunctions.push({
          filePath: node.filePath,
          symbolName: func.name,
          line: func.line,
          kind: 'function',
          category: 'deadFunction',
        });
      }
    });
  });

  // 2-4. Unused Variables 분석
  fileMetadataList.forEach(({ node, localVariables, usedIdentifiers }) => {
    localVariables.forEach(variable => {
      if (!usedIdentifiers.has(variable.name)) {
        results.unusedVariables.push({
          filePath: node.filePath,
          symbolName: variable.name,
          line: variable.line,
          kind: 'variable',
          category: 'unusedVariable',
        });
      }
    });
  });

  // 2-5. Unused Props 분석
  fileMetadataList.forEach(({ node, componentProps }) => {
    componentProps.forEach(componentInfo => {
      componentInfo.props.forEach(prop => {
        // isDeclared: true이지만 isUsed: false인 props만
        if (prop.isDeclared && !prop.isUsed) {
          results.unusedProps.push({
            filePath: node.filePath,
            symbolName: prop.name,
            line: prop.line,
            kind: 'prop',
            category: 'unusedProp',
            componentName: componentInfo.componentName
          });
        }
      });
    });
  });

  // 2-6. Unused Arguments 분석
  fileMetadataList.forEach(({ node, functionArguments }) => {
    functionArguments.forEach(functionInfo => {
      functionInfo.arguments.forEach(arg => {
        // isDeclared: true이지만 isUsed: false인 arguments만
        if (arg.isDeclared && !arg.isUsed) {
          results.unusedArguments.push({
            filePath: node.filePath,
            symbolName: arg.name,
            line: arg.line,
            kind: 'argument',
            category: 'unusedArgument',
            functionName: functionInfo.functionName
          });
        }
      });
    });
  });

  // Calculate total count
  results.totalCount =
    results.unusedExports.length +
    results.unusedImports.length +
    results.deadFunctions.length +
    results.unusedVariables.length +
    results.unusedProps.length +
    results.unusedArguments.length;

  console.log('[deadCodeAnalyzer] Analysis complete:', {
    unusedExports: results.unusedExports.length,
    unusedImports: results.unusedImports.length,
    deadFunctions: results.deadFunctions.length,
    unusedVariables: results.unusedVariables.length,
    unusedProps: results.unusedProps.length,
    unusedArguments: results.unusedArguments.length,
    total: results.totalCount,
  });

  return results;
}
