import ts from 'typescript';
import { getExportsFromLSIF, getImportsFromLSIF, getSymbolUsagesFromLSIF } from '../../../shared/lsif/query';
import type { SourceFileNode } from '../model/types';

export interface ExportInfo {
  name: string;
  line: number;
  kind: 'function' | 'variable' | 'type' | 'interface' | 'class' | 'enum';
}

export interface ImportInfo {
  name: string;
  line: number;
  from: string;
  isDefault: boolean;
  isNamespace: boolean;
}

export function getExports(node: SourceFileNode): ExportInfo[] {
  if (node.type !== 'file') return [];

  if (node.views?.exports) {
    return node.views.exports;
  }

  if (node.sourceFile) {
    return extractExportsFromAST(node.sourceFile);
  }

  return [];
}

export function getImports(node: SourceFileNode): ImportInfo[] {
  if (node.type !== 'file') return [];

  if (node.views?.imports) {
    return node.views.imports;
  }

  if (node.sourceFile) {
    return extractImportsFromAST(node.sourceFile);
  }

  return [];
}

export function getSymbolUsages(node: SourceFileNode, symbolName: string): string[] {
  if (node.type !== 'file') return [];

  if (node.views?.usages?.[symbolName]) {
    return node.views.usages[symbolName];
  }

  return [];
}

export async function getExportsAsync(node: SourceFileNode): Promise<ExportInfo[]> {
  if (node.type !== 'file') return [];

  try {
    const lsifExports = await getExportsFromLSIF(node.filePath);
    if (lsifExports.length > 0) {
      console.log(`[getExportsAsync] LSIF hit for ${node.filePath}: ${lsifExports.length} exports`);
      return lsifExports;
    }
  } catch (error) {
    console.warn(`[getExportsAsync] LSIF query failed for ${node.filePath}:`, error);
  }

  if (node.views?.exports) {
    return node.views.exports;
  }

  if (node.sourceFile) {
    return extractExportsFromAST(node.sourceFile);
  }

  return [];
}

export async function getImportsAsync(node: SourceFileNode): Promise<ImportInfo[]> {
  if (node.type !== 'file') return [];

  try {
    const lsifImports = await getImportsFromLSIF(node.filePath);
    if (lsifImports.length > 0) {
      console.log(`[getImportsAsync] LSIF hit for ${node.filePath}: ${lsifImports.length} imports`);
      return lsifImports;
    }
  } catch (error) {
    console.warn(`[getImportsAsync] LSIF query failed for ${node.filePath}:`, error);
  }

  if (node.views?.imports) {
    return node.views.imports;
  }

  if (node.sourceFile) {
    return extractImportsFromAST(node.sourceFile);
  }

  return [];
}

export async function getSymbolUsagesAsync(node: SourceFileNode, symbolName: string): Promise<string[]> {
  if (node.type !== 'file') return [];

  try {
    const lsifUsages = await getSymbolUsagesFromLSIF(node.filePath, symbolName);
    if (lsifUsages.length > 0) {
      console.log(`[getSymbolUsagesAsync] LSIF hit for ${node.filePath}#${symbolName}: ${lsifUsages.length} usages`);
      return lsifUsages;
    }
  } catch (error) {
    console.warn(`[getSymbolUsagesAsync] LSIF query failed for ${node.filePath}#${symbolName}:`, error);
  }

  if (node.views?.usages?.[symbolName]) {
    return node.views.usages[symbolName];
  }

  return [];
}

function getLineNumber(sourceFile: ts.SourceFile, node: ts.Node): number {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  return line + 1;
}

function extractExportsFromAST(sourceFile: ts.SourceFile): ExportInfo[] {
  const exports: ExportInfo[] = [];

  function visit(astNode: ts.Node) {
    if (ts.canHaveModifiers(astNode)) {
      const modifiers = ts.getModifiers(astNode);
      const hasExport = modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

      if (hasExport) {
        if (ts.isFunctionDeclaration(astNode) && astNode.name) {
          exports.push({
            name: astNode.name.text,
            line: getLineNumber(sourceFile, astNode),
            kind: 'function',
          });
        } else if (ts.isVariableStatement(astNode)) {
          astNode.declarationList.declarations.forEach((decl) => {
            if (ts.isIdentifier(decl.name)) {
              exports.push({
                name: decl.name.text,
                line: getLineNumber(sourceFile, decl),
                kind: 'variable',
              });
            }
          });
        } else if (ts.isTypeAliasDeclaration(astNode)) {
          exports.push({
            name: astNode.name.text,
            line: getLineNumber(sourceFile, astNode),
            kind: 'type',
          });
        } else if (ts.isInterfaceDeclaration(astNode)) {
          exports.push({
            name: astNode.name.text,
            line: getLineNumber(sourceFile, astNode),
            kind: 'interface',
          });
        } else if (ts.isClassDeclaration(astNode) && astNode.name) {
          exports.push({
            name: astNode.name.text,
            line: getLineNumber(sourceFile, astNode),
            kind: 'class',
          });
        } else if (ts.isEnumDeclaration(astNode)) {
          exports.push({
            name: astNode.name.text,
            line: getLineNumber(sourceFile, astNode),
            kind: 'enum',
          });
        }
      }
    }

    ts.forEachChild(astNode, visit);
  }

  visit(sourceFile);
  return exports;
}

function extractImportsFromAST(sourceFile: ts.SourceFile): ImportInfo[] {
  const imports: ImportInfo[] = [];

  sourceFile.statements.forEach((statement) => {
    if (!ts.isImportDeclaration(statement)) return;

    const moduleSpecifier = statement.moduleSpecifier;
    const from = ts.isStringLiteral(moduleSpecifier) ? moduleSpecifier.text : '';
    const line = getLineNumber(sourceFile, statement);
    const importClause = statement.importClause;

    if (!importClause) return;

    if (importClause.name) {
      imports.push({
        name: importClause.name.text,
        line,
        from,
        isDefault: true,
        isNamespace: false,
      });
    }

    if (!importClause.namedBindings) return;

    if (ts.isNamedImports(importClause.namedBindings)) {
      importClause.namedBindings.elements.forEach((element) => {
        imports.push({
          name: element.name.text,
          line: getLineNumber(sourceFile, element.name),
          from,
          isDefault: false,
          isNamespace: false,
        });
      });
      return;
    }

    if (ts.isNamespaceImport(importClause.namedBindings)) {
      imports.push({
        name: importClause.namedBindings.name.text,
        line,
        from,
        isDefault: false,
        isNamespace: true,
      });
    }
  });

  return imports;
}
