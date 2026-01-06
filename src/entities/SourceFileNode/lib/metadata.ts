/**
 * Getter Layer: SourceFileNode → 메타데이터
 *
 * AST와 사용처 사이의 추상화 계층
 * - 현재: LSIF IndexedDB 조회 → View Map → AST 순회 (3단계 fallback)
 * - 미래: LSIF만 사용 (View Map, AST 제거 가능)
 *
 * 금지 사항:
 * - SourceFileNode에 metadata 필드 추가 금지
 * - Private 함수 직접 호출 금지
 * - Public getter만 사용
 */

import ts from 'typescript';
import type { SourceFileNode } from '../model/types';
import {
  getExportsFromLSIF,
  getImportsFromLSIF,
  getSymbolUsagesFromLSIF,
} from '../../../shared/lsif/query';

// ========================================
// Public 인터페이스
// ========================================

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

export interface DeclarationInfo {
  name: string;
  line: number;
  kind: 'function' | 'variable' | 'class';
}

export interface PropInfo {
  name: string;
  line: number;
  componentName: string; // 어느 컴포넌트의 prop인지
  isDeclared: boolean; // Props 타입에 정의됨
  isUsed: boolean; // 컴포넌트 내에서 실제 사용됨
}

export interface ComponentPropsInfo {
  componentName: string;
  line: number;
  props: PropInfo[];
}

export interface ArgumentInfo {
  name: string;
  line: number;
  functionName: string; // 어느 함수의 argument인지
  isDeclared: boolean; // 파라미터로 선언됨
  isUsed: boolean; // 함수 body에서 실제 사용됨
}

export interface FunctionArgumentsInfo {
  functionName: string;
  line: number;
  arguments: ArgumentInfo[];
}

// ========================================
// Public Getter 함수
// ========================================

/**
 * 파일의 모든 export 정보 추출
 *
 * 우선순위:
 * 1. LSIF IndexedDB (Graph Database) - 가장 빠름
 * 2. View Map (Worker에서 생성) - 빠름
 * 3. AST 순회 (Fallback) - 느림
 *
 * @example
 * const exports = getExports(node);
 * exports.forEach(exp => console.log(exp.name, exp.line));
 */
export function getExports(node: SourceFileNode): ExportInfo[] {
  if (node.type !== 'file') return [];

  // 🔥 1. LSIF IndexedDB 조회 시도 (비동기이므로 Promise 반환 불가)
  // TODO: async getter로 전환하거나, 컴포넌트에서 useEffect로 조회
  // 현재는 동기 조회만 지원하므로 LSIF는 나중에 활용

  // 🔥 2. View Map 조회 (AST 순회 없음!)
  if (node.views?.exports) {
    return node.views.exports;
  }

  // 🔥 3. Fallback: View가 없으면 기존 AST 순회 (호환성)
  if (node.sourceFile) {
    return extractExportsFromAST(node.sourceFile);
  }

  return [];
}

/**
 * 파일의 모든 import 정보 추출
 */
export function getImports(node: SourceFileNode): ImportInfo[] {
  if (node.type !== 'file') return [];

  // 🔥 View 우선 조회 (AST 순회 없음!)
  if (node.views?.imports) {
    return node.views.imports;
  }

  // Fallback: View가 없으면 기존 AST 순회 (호환성)
  if (node.sourceFile) {
    return extractImportsFromAST(node.sourceFile);
  }

  return [];
}

/**
 * 특정 symbol의 usage 정보 조회 (어떤 파일들이 이 symbol을 import하는지)
 * @param node - 파일 노드
 * @param symbolName - 조회할 symbol 이름
 * @returns import하는 파일 경로 배열
 */
export function getSymbolUsages(node: SourceFileNode, symbolName: string): string[] {
  if (node.type !== 'file') return [];

  // 🔥 View 우선 조회 (AST 순회 없음!)
  if (node.views?.usages && node.views.usages[symbolName]) {
    return node.views.usages[symbolName];
  }

  // Fallback: View가 없으면 빈 배열 (Usage는 Worker에서만 계산)
  return [];
}

/**
 * export되지 않은 로컬 함수 추출
 */
export function getLocalFunctions(node: SourceFileNode): DeclarationInfo[] {
  if (!node.sourceFile || node.type !== 'file') return [];
  return extractLocalFunctionsFromAST(node.sourceFile);
}

/**
 * export되지 않은 로컬 변수 추출
 */
export function getLocalVariables(node: SourceFileNode): DeclarationInfo[] {
  if (!node.sourceFile || node.type !== 'file') return [];
  return extractLocalVariablesFromAST(node.sourceFile);
}

/**
 * 파일 내에서 사용된 모든 identifier 추출
 */
export function getUsedIdentifiers(node: SourceFileNode): Set<string> {
  if (!node.sourceFile || node.type !== 'file') return new Set();
  return extractUsedIdentifiersFromAST(node.sourceFile);
}

/**
 * 컴포넌트의 props 정보 추출 (unused props 감지용)
 */
export function getComponentProps(node: SourceFileNode): ComponentPropsInfo[] {
  if (!node.sourceFile || node.type !== 'file') return [];
  return extractComponentPropsFromAST(node.sourceFile);
}

/**
 * 함수의 arguments 정보 추출 (unused arguments 감지용)
 */
export function getFunctionArguments(node: SourceFileNode): FunctionArgumentsInfo[] {
  if (!node.sourceFile || node.type !== 'file') return [];
  return extractFunctionArgumentsFromAST(node.sourceFile);
}

// ========================================
// Private 구현 함수 (외부에서 직접 호출 금지)
// ========================================

/**
 * Line number 계산 헬퍼
 */
function getLineNumber(sourceFile: ts.SourceFile, node: ts.Node): number {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  return line + 1; // Convert to 1-based
}

/**
 * AST에서 exports 추출 (Private)
 */
function extractExportsFromAST(sourceFile: ts.SourceFile): ExportInfo[] {
  const exports: ExportInfo[] = [];

  function visit(astNode: ts.Node) {
    // Export 키워드가 있는 선언
    if (ts.canHaveModifiers(astNode)) {
      const modifiers = ts.getModifiers(astNode);
      const hasExport = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

      if (hasExport) {
        // Function declarations
        if (ts.isFunctionDeclaration(astNode) && astNode.name) {
          exports.push({
            name: astNode.name.text,
            line: getLineNumber(sourceFile, astNode),
            kind: 'function',
          });
        }
        // Variable statements
        else if (ts.isVariableStatement(astNode)) {
          astNode.declarationList.declarations.forEach((decl) => {
            if (ts.isIdentifier(decl.name)) {
              exports.push({
                name: decl.name.text,
                line: getLineNumber(sourceFile, decl),
                kind: 'variable',
              });
            }
          });
        }
        // Type alias
        else if (ts.isTypeAliasDeclaration(astNode)) {
          exports.push({
            name: astNode.name.text,
            line: getLineNumber(sourceFile, astNode),
            kind: 'type',
          });
        }
        // Interface
        else if (ts.isInterfaceDeclaration(astNode)) {
          exports.push({
            name: astNode.name.text,
            line: getLineNumber(sourceFile, astNode),
            kind: 'interface',
          });
        }
        // Class
        else if (ts.isClassDeclaration(astNode) && astNode.name) {
          exports.push({
            name: astNode.name.text,
            line: getLineNumber(sourceFile, astNode),
            kind: 'class',
          });
        }
        // Enum
        else if (ts.isEnumDeclaration(astNode)) {
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

/**
 * AST에서 imports 추출 (Private)
 */
function extractImportsFromAST(sourceFile: ts.SourceFile): ImportInfo[] {
  const imports: ImportInfo[] = [];

  sourceFile.statements.forEach((statement) => {
    if (ts.isImportDeclaration(statement)) {
      const moduleSpecifier = statement.moduleSpecifier;
      const from = ts.isStringLiteral(moduleSpecifier) ? moduleSpecifier.text : '';
      const line = getLineNumber(sourceFile, statement);

      const importClause = statement.importClause;
      if (!importClause) return;

      // Default import: import React from 'react'
      if (importClause.name) {
        imports.push({
          name: importClause.name.text,
          line,
          from,
          isDefault: true,
          isNamespace: false,
        });
      }

      // Named imports: import { useState, useEffect } from 'react'
      if (importClause.namedBindings) {
        if (ts.isNamedImports(importClause.namedBindings)) {
          importClause.namedBindings.elements.forEach((element) => {
            imports.push({
              name: element.name.text,
              line: getLineNumber(sourceFile, element.name), // ← element의 정확한 위치
              from,
              isDefault: false,
              isNamespace: false,
            });
          });
        }
        // Namespace import: import * as React from 'react'
        else if (ts.isNamespaceImport(importClause.namedBindings)) {
          imports.push({
            name: importClause.namedBindings.name.text,
            line,
            from,
            isDefault: false,
            isNamespace: true,
          });
        }
      }
    }
  });

  return imports;
}

/**
 * AST에서 로컬 함수 추출 (Private)
 * 함수 내부에 선언되었지만 사용되지 않는 로컬 함수를 추출
 */
function extractLocalFunctionsFromAST(sourceFile: ts.SourceFile): DeclarationInfo[] {
  const unusedFunctions: DeclarationInfo[] = [];

  function visit(node: ts.Node) {
    // 함수/메서드/화살표 함수 내부 분석
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)
    ) {
      if (!node.body) return;

      // 해당 함수 스코프 내의 함수 선언 수집
      const declaredFunctions = new Map<string, { line: number }>();
      const usedIdentifiers = new Set<string>();

      function collectFunctions(n: ts.Node) {
        // Function declaration
        if (ts.isFunctionDeclaration(n) && n.name) {
          declaredFunctions.set(n.name.text, {
            line: getLineNumber(sourceFile, n),
          });
        }

        // Function expression or arrow function assigned to variable
        if (ts.isVariableStatement(n)) {
          n.declarationList.declarations.forEach((decl) => {
            if (ts.isIdentifier(decl.name) && decl.initializer) {
              if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
                declaredFunctions.set(decl.name.text, {
                  line: getLineNumber(sourceFile, decl),
                });
              }
            }
          });
        }

        ts.forEachChild(n, collectFunctions);
      }

      function collectUsages(n: ts.Node) {
        if (ts.isIdentifier(n)) {
          // 선언이 아닌 사용만 체크
          const parent = n.parent;
          if (parent && !ts.isFunctionDeclaration(parent) && !ts.isVariableDeclaration(parent)) {
            usedIdentifiers.add(n.text);
          }
        }
        ts.forEachChild(n, collectUsages);
      }

      // 함수 body 분석
      collectFunctions(node.body);
      collectUsages(node.body);

      // 선언되었지만 사용되지 않은 함수 찾기
      declaredFunctions.forEach((info, funcName) => {
        if (!usedIdentifiers.has(funcName)) {
          unusedFunctions.push({
            name: funcName,
            line: info.line,
            kind: 'function',
          });
        }
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return unusedFunctions;
}

/**
 * AST에서 로컬 변수 추출 (Private)
 * 함수 내부의 사용되지 않는 로컬 변수를 추출
 */
function extractLocalVariablesFromAST(sourceFile: ts.SourceFile): DeclarationInfo[] {
  const unusedVariables: DeclarationInfo[] = [];

  function visit(node: ts.Node) {
    // 함수/메서드/화살표 함수 내부 분석
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)
    ) {
      if (!node.body) return;

      // 해당 함수 스코프 내의 변수 선언 수집
      const declaredVariables = new Map<string, { line: number; node: ts.VariableDeclaration }>();
      const usedIdentifiers = new Set<string>();

      function collectVariables(n: ts.Node) {
        if (ts.isVariableStatement(n)) {
          n.declarationList.declarations.forEach((decl) => {
            if (ts.isIdentifier(decl.name)) {
              // 함수가 아닌 변수만
              if (
                !decl.initializer ||
                (!ts.isArrowFunction(decl.initializer) &&
                  !ts.isFunctionExpression(decl.initializer) &&
                  !ts.isFunctionDeclaration(decl.initializer))
              ) {
                declaredVariables.set(decl.name.text, {
                  line: getLineNumber(sourceFile, decl),
                  node: decl,
                });
              }
            }
          });
        }
        ts.forEachChild(n, collectVariables);
      }

      function collectUsages(n: ts.Node) {
        if (ts.isIdentifier(n)) {
          // 선언이 아닌 사용만 체크
          const parent = n.parent;
          if (parent && !ts.isVariableDeclaration(parent)) {
            usedIdentifiers.add(n.text);
          }
        }
        ts.forEachChild(n, collectUsages);
      }

      // 함수 body 분석
      collectVariables(node.body);
      collectUsages(node.body);

      // 선언되었지만 사용되지 않은 변수 찾기
      declaredVariables.forEach((info, varName) => {
        if (!usedIdentifiers.has(varName)) {
          unusedVariables.push({
            name: varName,
            line: info.line,
            kind: 'variable',
          });
        }
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return unusedVariables;
}

/**
 * AST에서 사용된 identifiers 추출 (Private)
 *
 * 개선 사항:
 * - Destructuring된 변수 감지 추가
 * - BindingElement (구조 분해 할당의 각 요소) 처리
 */
function extractUsedIdentifiersFromAST(sourceFile: ts.SourceFile): Set<string> {
  const usedIdentifiers = new Set<string>();

  function isDeclarationName(node: ts.Node): boolean {
    const parent = node.parent;
    if (!parent) return false;

    // Import 이름
    if (ts.isImportClause(parent) || ts.isImportSpecifier(parent) || ts.isNamespaceImport(parent)) {
      return true;
    }

    // BindingElement (구조 분해 할당의 각 요소)
    // 예: const { foo, bar } = obj; 에서 foo, bar
    if (ts.isBindingElement(parent)) {
      return parent.name === node;
    }

    // Declaration 이름 (interface, type 포함)
    if (
      ts.isFunctionDeclaration(parent) ||
      ts.isVariableDeclaration(parent) ||
      ts.isClassDeclaration(parent) ||
      ts.isInterfaceDeclaration(parent) ||
      ts.isTypeAliasDeclaration(parent) ||
      ts.isParameter(parent) ||
      ts.isEnumDeclaration(parent)
    ) {
      return parent.name === node;
    }

    // Property assignment의 왼쪽 (선언)
    // 예: { foo: foo } 에서 첫 번째 foo는 선언, 두 번째 foo는 사용
    if (ts.isPropertyAssignment(parent)) {
      return parent.name === node;
    }

    // Property signature (interface/type의 필드명)
    if (ts.isPropertySignature(parent) || ts.isPropertyDeclaration(parent)) {
      return parent.name === node;
    }

    return false;
  }

  function visit(astNode: ts.Node) {
    // Import declarations는 skip
    if (ts.isImportDeclaration(astNode)) {
      return;
    }

    // Type declarations는 내부 순회하지 않음 (type-only usage 제외)
    // 하지만 type annotation은 순회해서 사용된 타입 추적
    if (ts.isInterfaceDeclaration(astNode) || ts.isTypeAliasDeclaration(astNode)) {
      // Type의 body만 순회 (name은 선언이므로 제외)
      astNode.getChildren(sourceFile).forEach((child) => {
        if (child !== astNode.name) {
          visit(child);
        }
      });
      return;
    }

    // Identifier 수집 (선언 이름 제외)
    if (ts.isIdentifier(astNode)) {
      if (!isDeclarationName(astNode)) {
        usedIdentifiers.add(astNode.text);
      }
    }

    // getChildren()으로 type annotation 포함 모든 child 순회
    astNode.getChildren(sourceFile).forEach(visit);
  }

  visit(sourceFile);
  return usedIdentifiers;
}

/**
 * AST에서 컴포넌트의 props 정보 추출 (Private)
 *
 * 감지 로직:
 * 1. 컴포넌트 함수 찾기 (PascalCase 함수명)
 * 2. 첫 번째 파라미터의 타입에서 props 필드 추출
 * 3. Destructuring된 props 또는 props.xxx 사용 확인
 */
function extractComponentPropsFromAST(sourceFile: ts.SourceFile): ComponentPropsInfo[] {
  const componentsInfo: ComponentPropsInfo[] = [];

  function isComponentFunction(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction): boolean {
    // 함수명이 PascalCase인지 확인 (React 컴포넌트 규칙)
    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.text;
      return /^[A-Z]/.test(name); // 대문자로 시작
    }
    // VariableDeclaration의 경우 (const MyComponent = () => {})
    if ((ts.isFunctionExpression(node) || ts.isArrowFunction(node)) && node.parent) {
      if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
        const name = node.parent.name.text;
        return /^[A-Z]/.test(name);
      }
    }
    return false;
  }

  function getComponentName(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction): string | null {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return node.name.text;
    }
    if ((ts.isFunctionExpression(node) || ts.isArrowFunction(node)) && node.parent) {
      if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
        return node.parent.name.text;
      }
    }
    return null;
  }

  /**
   * Props 타입 정의에서 모든 필드 추출
   */
  function extractPropsFromType(typeNode: ts.TypeNode | undefined, sourceFile: ts.SourceFile): string[] {
    if (!typeNode) return [];

    const props: string[] = [];

    // Inline object type: { name: string; age: number }
    if (ts.isTypeLiteralNode(typeNode)) {
      typeNode.members.forEach((member) => {
        if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
          props.push(member.name.text);
        }
      });
      return props;
    }

    // Type reference: MyProps
    if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
      const typeName = typeNode.typeName.text;

      // 파일에서 해당 interface/type 정의 찾기
      sourceFile.statements.forEach((statement) => {
        // interface MyProps { ... }
        if (ts.isInterfaceDeclaration(statement) && statement.name.text === typeName) {
          statement.members.forEach((member) => {
            if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
              props.push(member.name.text);
            }
          });
        }
        // type MyProps = { ... }
        if (ts.isTypeAliasDeclaration(statement) && statement.name.text === typeName) {
          if (ts.isTypeLiteralNode(statement.type)) {
            statement.type.members.forEach((member) => {
              if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
                props.push(member.name.text);
              }
            });
          }
        }
      });
    }

    return props;
  }

  /**
   * Destructuring된 props 추출
   */
  function extractDestructuredProps(param: ts.ParameterDeclaration): string[] {
    const props: string[] = [];

    // { name, age }: Props 패턴
    if (ts.isObjectBindingPattern(param.name)) {
      param.name.elements.forEach((element) => {
        if (ts.isIdentifier(element.name)) {
          props.push(element.name.text);
        }
      });
    }

    return props;
  }

  /**
   * 컴포넌트 body에서 props.xxx 사용 추출
   */
  function extractPropsUsage(body: ts.Node | undefined, propsParamName: string): string[] {
    if (!body) return [];

    const usedProps: string[] = [];

    function visit(node: ts.Node) {
      // props.xxx 패턴
      if (ts.isPropertyAccessExpression(node)) {
        if (ts.isIdentifier(node.expression) && node.expression.text === propsParamName) {
          if (ts.isIdentifier(node.name)) {
            usedProps.push(node.name.text);
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(body);
    return usedProps;
  }

  function analyzeComponent(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction) {
    if (!isComponentFunction(node)) return;

    const componentName = getComponentName(node);
    if (!componentName) return;

    const firstParam = node.parameters[0];
    if (!firstParam) return; // Props 없는 컴포넌트

    const line = getLineNumber(sourceFile, node);

    // 1. Props 타입에서 정의된 모든 필드 추출
    const declaredProps = extractPropsFromType(firstParam.type, sourceFile);
    if (declaredProps.length === 0) return; // Props 타입 없으면 skip

    // 2. Destructuring된 props 추출
    const destructuredProps = extractDestructuredProps(firstParam);

    // 3. props.xxx 사용 추출
    const propsParamName = ts.isIdentifier(firstParam.name) ? firstParam.name.text : 'props';
    const propsUsage = extractPropsUsage(node.body, propsParamName);

    // 4. 사용된 props = destructured + props.xxx
    const usedPropsSet = new Set([...destructuredProps, ...propsUsage]);

    // 5. PropInfo[] 생성
    const props: PropInfo[] = declaredProps.map((propName) => ({
      name: propName,
      line: line,
      componentName: componentName,
      isDeclared: true,
      isUsed: usedPropsSet.has(propName),
    }));

    componentsInfo.push({
      componentName,
      line,
      props,
    });
  }

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node)) {
      analyzeComponent(node);
    }
    // const MyComponent = () => {}
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach((decl) => {
        if (decl.initializer) {
          if (ts.isFunctionExpression(decl.initializer) || ts.isArrowFunction(decl.initializer)) {
            analyzeComponent(decl.initializer);
          }
        }
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return componentsInfo;
}

/**
 * AST에서 함수의 arguments 정보 추출 (Private)
 *
 * 감지 로직:
 * 1. 함수 선언 찾기 (컴포넌트 제외)
 * 2. 파라미터 추출
 * 3. 함수 body에서 파라미터 사용 여부 확인
 */
function extractFunctionArgumentsFromAST(sourceFile: ts.SourceFile): FunctionArgumentsInfo[] {
  const functionsInfo: FunctionArgumentsInfo[] = [];

  function isComponentFunction(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction): boolean {
    // 함수명이 PascalCase인지 확인 (React 컴포넌트 규칙)
    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.text;
      return /^[A-Z]/.test(name); // 대문자로 시작
    }
    // VariableDeclaration의 경우 (const MyComponent = () => {})
    if ((ts.isFunctionExpression(node) || ts.isArrowFunction(node)) && node.parent) {
      if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
        const name = node.parent.name.text;
        return /^[A-Z]/.test(name);
      }
    }
    return false;
  }

  function getFunctionName(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction): string | null {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return node.name.text;
    }
    if ((ts.isFunctionExpression(node) || ts.isArrowFunction(node)) && node.parent) {
      if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
        return node.parent.name.text;
      }
    }
    return null;
  }

  /**
   * 파라미터에서 identifier 추출 (destructuring 지원)
   */
  function extractParameterNames(param: ts.ParameterDeclaration): string[] {
    const names: string[] = [];

    // 일반 파라미터: function foo(a, b) {}
    if (ts.isIdentifier(param.name)) {
      names.push(param.name.text);
    }
    // Destructuring: function foo({ a, b }) {}
    else if (ts.isObjectBindingPattern(param.name)) {
      param.name.elements.forEach((element) => {
        if (ts.isIdentifier(element.name)) {
          names.push(element.name.text);
        }
      });
    }
    // Array destructuring: function foo([a, b]) {}
    else if (ts.isArrayBindingPattern(param.name)) {
      param.name.elements.forEach((element) => {
        if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
          names.push(element.name.text);
        }
      });
    }

    return names;
  }

  /**
   * 함수 body에서 identifier 사용 여부 확인
   */
  function isIdentifierUsedInBody(body: ts.Node | undefined, identifierName: string): boolean {
    if (!body) return false;

    let isUsed = false;

    function visit(node: ts.Node) {
      // 파라미터 선언 자체는 제외
      if (ts.isParameter(node)) return;

      // Identifier 사용 확인
      if (ts.isIdentifier(node) && node.text === identifierName) {
        // 선언이 아닌 사용만 체크
        const parent = node.parent;
        if (parent && !ts.isParameter(parent)) {
          isUsed = true;
          return;
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(body);
    return isUsed;
  }

  function analyzeFunction(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction) {
    // 컴포넌트는 제외 (getComponentProps에서 처리)
    if (isComponentFunction(node)) return;

    const functionName = getFunctionName(node);
    if (!functionName) return; // 익명 함수는 skip

    const parameters = node.parameters;
    if (parameters.length === 0) return; // 파라미터 없는 함수는 skip

    const line = getLineNumber(sourceFile, node);

    // 모든 파라미터 분석
    const argumentsInfo: ArgumentInfo[] = [];

    parameters.forEach((param) => {
      // Rest parameters는 skip (...args)
      if (param.dotDotDotToken) return;

      const paramNames = extractParameterNames(param);

      paramNames.forEach((paramName) => {
        const isUsed = isIdentifierUsedInBody(node.body, paramName);

        argumentsInfo.push({
          name: paramName,
          line: getLineNumber(sourceFile, param),
          functionName: functionName,
          isDeclared: true,
          isUsed: isUsed,
        });
      });
    });

    // Unused arguments가 있으면 추가
    if (argumentsInfo.some((arg) => !arg.isUsed)) {
      functionsInfo.push({
        functionName,
        line,
        arguments: argumentsInfo,
      });
    }
  }

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node)) {
      analyzeFunction(node);
    }
    // const myFunc = () => {}
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach((decl) => {
        if (decl.initializer) {
          if (ts.isFunctionExpression(decl.initializer) || ts.isArrowFunction(decl.initializer)) {
            analyzeFunction(decl.initializer);
          }
        }
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return functionsInfo;
}

// ========================================
// 🔥 Performance Optimization: FileMetadata Caching
// ========================================

import type { DefinitionSymbol } from '../../../widgets/Panels/DefinitionPanel/definitionExtractor.ts';
import type { OutlineNode } from '../../../shared/outlineExtractor';
import { extractDefinitions } from '../../../widgets/Panels/DefinitionPanel/definitionExtractor.ts';
import { extractOutlineStructure } from '../../../shared/outlineExtractor';

export interface FileMetadata {
  definitions: DefinitionSymbol[];
  outlineNodes: OutlineNode[];
}

/**
 * 🔥 Performance Cache: WeakMap을 사용하여 ts.SourceFile을 키로 메타데이터 캐싱
 *
 * - 동일한 파일에 대해 여러 컴포넌트가 getFileMetadata()를 호출해도 AST 순회는 1번만 실행
 * - WeakMap이므로 파일이 삭제되면 자동으로 메모리에서 제거됨
 * - App.tsx와 IDEView.tsx에서 extractDefinitions()를 중복 호출하는 문제 해결
 */
const fileMetadataCache = new WeakMap<ts.SourceFile, FileMetadata>();

/**
 * Get file metadata (definitions + outline structure) - WITH CACHING
 *
 * **캐싱 전략**:
 * - 첫 호출: AST 순회 1회 실행 + 캐시 저장
 * - 이후 호출: 캐시된 결과 즉시 반환
 *
 * **사용처**:
 * - App.tsx: DefinitionPanel용 definitions
 * - IDEView.tsx: OutlinePanel용 outlineNodes + DefinitionPanel용 definitions
 * - CodeDocView.tsx: 문서 생성용 definitions
 *
 * **성능 개선**:
 * - Before: AST 순회 3회 (App.tsx 1회 + IDEView.tsx 2회)
 * - After: AST 순회 1회 (첫 호출에만) + 캐시 재사용
 *
 * @param node - SourceFileNode (must have sourceFile)
 * @param files - Virtual file system (for type inference in extractDefinitions)
 * @returns FileMetadata with definitions and outlineNodes
 */
export function getFileMetadata(node: SourceFileNode, files?: Record<string, string>): FileMetadata {
  // 캐시 확인
  const cached = fileMetadataCache.get(node.sourceFile);
  if (cached) {
    console.log('[getFileMetadata] ✅ Cache hit for:', node.filePath);
    return cached;
  }

  console.log('[getFileMetadata] 🔥 Cache miss, extracting metadata for:', node.filePath);

  // 🔥 AST 순회 1회 - definitions + outline 동시 추출
  const definitions = extractDefinitions(node, files);
  const outlineNodes = extractOutlineStructure(node);

  const metadata: FileMetadata = {
    definitions,
    outlineNodes,
  };

  // 캐시 저장
  fileMetadataCache.set(node.sourceFile, metadata);

  return metadata;
}

/**
 * Invalidate cache for a specific file
 *
 * **사용 시점**:
 * - 파일 내용이 변경되었을 때
 * - filesAtom이 업데이트되고 parseProject()가 재실행될 때
 *
 * @param node - SourceFileNode to invalidate
 */
export function invalidateFileMetadata(node: SourceFileNode): void {
  fileMetadataCache.delete(node.sourceFile);
  console.log('[invalidateFileMetadata] 🗑️ Cache invalidated for:', node.filePath);
}

/**
 * Clear all metadata cache
 *
 * **사용 시점**:
 * - 전체 프로젝트가 다시 파싱될 때
 * - filesAtom이 완전히 교체될 때 (예: 새 폴더 업로드)
 */
export function clearAllMetadataCache(): void {
  // WeakMap은 clear() 메서드가 없으므로 로그만 출력
  // GC가 자동으로 메모리 회수
  console.log('[clearAllMetadataCache] 🗑️ Metadata cache will be garbage collected');
}

// ========================================
// LSIF Async Getters (Phase 3)
// ========================================

/**
 * LSIF IndexedDB에서 export 정보 조회 (비동기)
 *
 * 우선순위:
 * 1. LSIF IndexedDB (Graph Database) - 가장 빠름, persistent
 * 2. View Map (Fallback)
 * 3. AST 순회 (Fallback)
 *
 * @example
 * const exports = await getExportsAsync(node);
 * exports.forEach(exp => console.log(exp.name, exp.line));
 */
export async function getExportsAsync(node: SourceFileNode): Promise<ExportInfo[]> {
  if (node.type !== 'file') return [];

  try {
    // 🔥 1. LSIF IndexedDB 조회
    const lsifExports = await getExportsFromLSIF(node.filePath);
    if (lsifExports.length > 0) {
      console.log(`[getExportsAsync] ✅ LSIF hit for ${node.filePath}: ${lsifExports.length} exports`);
      return lsifExports;
    }
  } catch (error) {
    console.warn(`[getExportsAsync] ⚠️ LSIF query failed for ${node.filePath}:`, error);
  }

  // 🔥 2. View Map Fallback
  if (node.views?.exports) {
    console.log(`[getExportsAsync] 📦 View Map hit for ${node.filePath}`);
    return node.views.exports;
  }

  // 🔥 3. AST Fallback
  if (node.sourceFile) {
    console.log(`[getExportsAsync] 🐌 AST fallback for ${node.filePath}`);
    return extractExportsFromAST(node.sourceFile);
  }

  return [];
}

/**
 * LSIF IndexedDB에서 import 정보 조회 (비동기)
 */
export async function getImportsAsync(node: SourceFileNode): Promise<ImportInfo[]> {
  if (node.type !== 'file') return [];

  try {
    // 🔥 1. LSIF IndexedDB 조회
    const lsifImports = await getImportsFromLSIF(node.filePath);
    if (lsifImports.length > 0) {
      console.log(`[getImportsAsync] ✅ LSIF hit for ${node.filePath}: ${lsifImports.length} imports`);
      return lsifImports;
    }
  } catch (error) {
    console.warn(`[getImportsAsync] ⚠️ LSIF query failed for ${node.filePath}:`, error);
  }

  // 🔥 2. View Map Fallback
  if (node.views?.imports) {
    console.log(`[getImportsAsync] 📦 View Map hit for ${node.filePath}`);
    return node.views.imports;
  }

  // 🔥 3. AST Fallback
  if (node.sourceFile) {
    console.log(`[getImportsAsync] 🐌 AST fallback for ${node.filePath}`);
    return extractImportsFromAST(node.sourceFile);
  }

  return [];
}

/**
 * LSIF IndexedDB에서 symbol usage 정보 조회 (비동기)
 * @param node - 파일 노드
 * @param symbolName - 조회할 symbol 이름
 * @returns import하는 파일 경로 배열
 */
export async function getSymbolUsagesAsync(
  node: SourceFileNode,
  symbolName: string
): Promise<string[]> {
  if (node.type !== 'file') return [];

  try {
    // 🔥 1. LSIF IndexedDB 조회
    const lsifUsages = await getSymbolUsagesFromLSIF(node.filePath, symbolName);
    if (lsifUsages.length > 0) {
      console.log(`[getSymbolUsagesAsync] ✅ LSIF hit for ${node.filePath}#${symbolName}: ${lsifUsages.length} usages`);
      return lsifUsages;
    }
  } catch (error) {
    console.warn(`[getSymbolUsagesAsync] ⚠️ LSIF query failed for ${node.filePath}#${symbolName}:`, error);
  }

  // 🔥 2. View Map Fallback
  if (node.views?.usages && node.views.usages[symbolName]) {
    console.log(`[getSymbolUsagesAsync] 📦 View Map hit for ${node.filePath}#${symbolName}`);
    return node.views.usages[symbolName];
  }

  // 🔥 3. No fallback for usages (Worker에서만 계산)
  return [];
}
