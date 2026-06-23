/**
 * Statement Block의 fold 메타데이터 수집
 * 간단한 접근법: Block 구조만 찾고, 가장 가까운 statement를 fold 시작점으로
 */

import * as ts from 'typescript';
import type { FoldInfo } from '@/entities/CodeFold/model/types.ts';

// CodeLine 인터페이스 (순환 참조 방지를 위해 필요한 필드만 정의)
interface CodeLineForFold {
  num: number;
  foldInfo?: FoldInfo;
}

export function collectFoldMetadata(sourceFile: ts.SourceFile, lines: CodeLineForFold[]): void {
  console.log(`[collectFoldMetadata] START - file has ${lines.length} lines`);

  // Import 블록 추적 (hook 방식)
  let currentImportStart: number | null = null;
  let currentImportEnd: number | null = null;

  // ===== Statement 판별 =====
  function isStatement(node: ts.Node): boolean {
    // 1️⃣ TypeScript의 표준 Statement 범위
    if (node.kind >= ts.SyntaxKind.FirstStatement && node.kind <= ts.SyntaxKind.LastStatement) {
      return true;
    }

    // 2️⃣ Declaration 타입들 (FirstStatement 범위 밖에 있지만 statement로 취급)
    return (
      ts.isFunctionDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isEnumDeclaration(node) ||
      ts.isModuleDeclaration(node)
    );
  }

  // ===== 가장 가까운 Statement 찾기 (자기 자신 포함) =====
  function findClosestStatement(node: ts.Node): ts.Node | null {
    let current: ts.Node | undefined = node;

    while (current) {
      if (isStatement(current)) {
        return current;
      }
      current = current.parent;
    }

    return null;
  }

  // ===== Import 블록 fold 메타데이터 추가 =====
  function flushImportBlock() {
    if (currentImportStart === null || currentImportEnd === null) return;

    if (
      currentImportStart >= 0 &&
      currentImportStart < lines.length &&
      currentImportEnd >= 0 &&
      currentImportEnd < lines.length
    ) {
      const actualStartLineNum = lines[currentImportStart].num;
      const actualEndLineNum = lines[currentImportEnd].num;

      lines[currentImportStart].foldInfo = {
        isFoldable: true,
        foldStart: actualStartLineNum,
        foldEnd: actualEndLineNum,
        foldType: 'import-block',
        depth: 1,
      };

      for (let i = currentImportStart + 1; i <= currentImportEnd; i++) {
        if (i >= 0 && i < lines.length) {
          lines[i].foldInfo = {
            isFoldable: false,
            foldStart: actualStartLineNum,
            foldEnd: actualEndLineNum,
            foldType: 'import-block',
            depth: 1,
          };
        }
      }
    }

    // 리셋
    currentImportStart = null;
    currentImportEnd = null;
  }

  // ===== 단일 순회로 모든 블록 처리 =====
  function visit(node: ts.Node, currentDepth: number = 1) {
    // 🎣 Hook: ImportDeclaration 감지
    if (ts.isImportDeclaration(node)) {
      const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line;
      const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;

      if (currentImportStart === null) {
        // 새 import 블록 시작
        currentImportStart = startLine;
        currentImportEnd = endLine;
      } else {
        // 기존 import 블록 확장
        currentImportEnd = endLine;
      }

      // Import는 여기서 재귀 중단 (자식 순회 불필요)
      return;
    }

    // Non-import 노드를 만나면 지금까지 모은 import 블록 처리
    if (currentImportStart !== null) {
      flushImportBlock();
    }
    // 일반 Block 처리
    let hasOpenBrace = false;
    const children = node.getChildren(sourceFile);
    for (const child of children) {
      if (child.kind === ts.SyntaxKind.OpenBraceToken) {
        hasOpenBrace = true;
        break;
      }
    }

    if (hasOpenBrace) {
      const closeBracePos = node.getEnd() - 1;
      const tsEndLine = sourceFile.getLineAndCharacterOfPosition(closeBracePos).line;

      // 가장 가까운 statement 찾기
      let closestStatement: ts.Node | null = null;
      if (isStatement(node)) {
        closestStatement = node;
      } else if (node.parent) {
        closestStatement = findClosestStatement(node.parent);
      }

      if (closestStatement) {
        const tsStartLine = sourceFile.getLineAndCharacterOfPosition(closestStatement.getStart(sourceFile)).line;

        // 한 줄짜리는 접을 필요 없음
        if (tsEndLine > tsStartLine && tsStartLine >= 0 && tsStartLine < lines.length && tsEndLine < lines.length) {
          const actualStartLineNum = lines[tsStartLine].num;
          const actualEndLineNum = lines[tsEndLine].num;

          // 공통 fold 정보
          const baseFoldInfo = {
            foldStart: actualStartLineNum,
            foldEnd: actualEndLineNum,
            foldType: 'function-block' as const,
            depth: currentDepth,
          };

          // 시작 라인: foldable
          lines[tsStartLine].foldInfo = {
            isFoldable: true,
            ...baseFoldInfo,
          };

          // 중간 라인들: non-foldable (중첩 블록의 시작점은 덮어쓰지 않음)
          for (let i = tsStartLine + 1; i <= tsEndLine; i++) {
            if (i >= 0 && i < lines.length) {
              if (!lines[i].foldInfo || !lines[i].foldInfo.isFoldable) {
                lines[i].foldInfo = {
                  isFoldable: false,
                  ...baseFoldInfo,
                };
              }
            }
          }
        }
      }
    }

    // 재귀: depth 증가는 블록이 있을 때만
    const nextDepth = hasOpenBrace ? currentDepth + 1 : currentDepth;
    ts.forEachChild(node, (child) => visit(child, nextDepth));
  }

  try {
    console.log('[collectFoldMetadata] Starting AST visit...');
    // sourceFile의 자식들을 depth 1로 시작
    ts.forEachChild(sourceFile, (child) => visit(child, 1));
    flushImportBlock(); // 파일 끝까지 import만 있는 경우 처리
    console.log('[collectFoldMetadata] AST visit completed');
  } catch (err) {
    console.error('❌ [collectFoldMetadata] Error:', err);
  }
}
