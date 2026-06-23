import { getSymbolUsages } from '@/entities/SourceFileNode/lib/metadata';
import type { SourceFileNode } from '@/entities/SourceFileNode/model/types';
import type { CodeLine } from '../model/types';

export interface CodeLineBlockInfo {
  isBlockStartLine: boolean;
  blockStartLineNum: number;
}

export function getCodeLineBlockInfo(line: CodeLine): CodeLineBlockInfo {
  const isImportBlock = line.foldInfo?.foldType === 'import-block';
  const isBlockStartLine = line.foldInfo?.isFoldable === true && !isImportBlock;

  return {
    isBlockStartLine,
    blockStartLineNum: line.num,
  };
}

export function getCodeLineExportedSymbolName(line: CodeLine): string | undefined {
  if (!line.hasDeclarationKeyword) return undefined;
  return line.segments.find((segment) => segment.isDeclarationName)?.text;
}

export function getCodeLineUsageCount(node: SourceFileNode, exportedSymbolName: string | undefined): number {
  if (!exportedSymbolName) return 0;
  return getSymbolUsages(node, exportedSymbolName).length;
}

export function isCodeLineNumberEmphasized(options: {
  hasDeclarationKeyword: boolean;
  isDefinitionLine: boolean;
  isFolded: boolean;
  isBlockStartLine: boolean;
}): boolean {
  return options.hasDeclarationKeyword || options.isDefinitionLine || options.isFolded || options.isBlockStartLine;
}
