/**
 * TypeScript 파서 메인 엔트리
 *
 * Babel 완전 제거, TypeScript 컴파일러 기반 파서
 * 목표: 외부 참조 중심 함수 호출 그래프
 */

import * as ts from 'typescript';
import type { GraphData, SourceFileNode } from '../../entities/SourceFileNode';
import { extractVueScript, isVueFile } from './utils/vueExtractor';
import { createLanguageService } from './utils/languageService';
import { getDependencies } from '../../entities/SourceFileNode/lib/getters';
import { resolvePath } from './utils/pathResolver';

/**
 * 프로젝트 파싱 메인 함수
 */
export function parseProject(
  files: Record<string, string>,
  entryFile: string
): GraphData {
  const nodes: SourceFileNode[] = [];
  const processedFiles = new Set<string>();

  // ✅ Language Service 생성 (identifier 정의 위치 파악용)
  const languageService = createLanguageService(files);
  const program = languageService.getProgram();

  if (!program) {
    console.error('❌ Language Service program not available');
    return { nodes: [] };
  }

  // ✅ 간단한 파일 처리: 각 파일 = 1개 노드
  function processFile(filePath: string): void {
    if (processedFiles.has(filePath)) return;

    const content = files[filePath];
    if (!content) return;

    // .d.ts 제외
    if (filePath.endsWith('.d.ts')) return;

    processedFiles.add(filePath);

    // ✅ 파일을 하나의 노드로 생성
    const fileName = filePath.split('/').pop() || filePath;
    const fileNameWithoutExt = fileName.replace(/\.(tsx?|jsx?|vue)$/, '');

    let node: SourceFileNode;

    // ✅ TypeScript로 import 및 identifier 추출
    try {
      const scriptKind = filePath.endsWith('.tsx') ? ts.ScriptKind.TSX :
                        filePath.endsWith('.jsx') ? ts.ScriptKind.JSX :
                        filePath.endsWith('.vue') ? ts.ScriptKind.TS :
                        ts.ScriptKind.TS;

      let parseContent = content;

      // Vue 파일이면 script 부분만 추출
      if (isVueFile(filePath)) {
        parseContent = extractVueScript(content, filePath) || '';
      }

      const sourceFile = ts.createSourceFile(
        filePath,
        parseContent,
        ts.ScriptTarget.Latest,
        true,
        scriptKind
      );

      // SourceFileNode 생성 (sourceFile 포함)
      const dependencies = getDependencies({ sourceFile, filePath, id: filePath } as any, files, resolvePath);

      node = {
        id: filePath,
        label: fileNameWithoutExt,
        filePath,
        type: 'module',
        codeSnippet: content,
        startLine: 1,
        sourceFile,
        dependencies  // 캐싱
      };

      nodes.push(node);

      // Import 재귀 처리
      dependencies.forEach(dep => processFile(dep));

    } catch (error) {
      console.error(`❌ Error parsing ${filePath}:`, error);
    }
  }

  // Entry file부터 시작
  processFile(entryFile);
  return { nodes };
}

// Re-export utilities
export { resolvePath } from './utils/pathResolver';
export { extractVueScript, extractVueTemplate, isVueFile } from './utils/vueExtractor';
export { createLanguageService } from './utils/languageService';
