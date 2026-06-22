import ts from 'typescript';
import type { SourceFileNode } from '@/entities/SourceFileNode/model/types';

interface DeclarationInfo {
  name: string;
  line: number;
  kind: 'function' | 'variable' | 'class';
}

interface PropInfo {
  name: string;
  line: number;
  componentName: string;
  isDeclared: boolean;
  isUsed: boolean;
}

interface ComponentPropsInfo {
  componentName: string;
  line: number;
  props: PropInfo[];
}

interface ArgumentInfo {
  name: string;
  line: number;
  functionName: string;
  isDeclared: boolean;
  isUsed: boolean;
}

interface FunctionArgumentsInfo {
  functionName: string;
  line: number;
  arguments: ArgumentInfo[];
}

export function getLocalFunctions(node: SourceFileNode): DeclarationInfo[] {
  if (!node.sourceFile || node.type !== 'file') return [];
  return extractLocalFunctionsFromAST(node.sourceFile);
}

export function getLocalVariables(node: SourceFileNode): DeclarationInfo[] {
  if (!node.sourceFile || node.type !== 'file') return [];
  return extractLocalVariablesFromAST(node.sourceFile);
}

export function getUsedIdentifiers(node: SourceFileNode): Set<string> {
  if (!node.sourceFile || node.type !== 'file') return new Set();
  return extractUsedIdentifiersFromAST(node.sourceFile);
}

export function getComponentProps(node: SourceFileNode): ComponentPropsInfo[] {
  if (!node.sourceFile || node.type !== 'file') return [];
  return extractComponentPropsFromAST(node.sourceFile);
}

export function getFunctionArguments(node: SourceFileNode): FunctionArgumentsInfo[] {
  if (!node.sourceFile || node.type !== 'file') return [];
  return extractFunctionArgumentsFromAST(node.sourceFile);
}

function getLineNumber(sourceFile: ts.SourceFile, node: ts.Node): number {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  return line + 1;
}

function extractLocalFunctionsFromAST(sourceFile: ts.SourceFile): DeclarationInfo[] {
  const unusedFunctions: DeclarationInfo[] = [];

  function visit(node: ts.Node) {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)
    ) {
      if (!node.body) return;

      const declaredFunctions = new Map<string, { line: number }>();
      const usedIdentifiers = new Set<string>();

      function collectFunctions(n: ts.Node) {
        if (ts.isFunctionDeclaration(n) && n.name) {
          declaredFunctions.set(n.name.text, {
            line: getLineNumber(sourceFile, n),
          });
        }

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
          const parent = n.parent;
          if (parent && !ts.isFunctionDeclaration(parent) && !ts.isVariableDeclaration(parent)) {
            usedIdentifiers.add(n.text);
          }
        }
        ts.forEachChild(n, collectUsages);
      }

      collectFunctions(node.body);
      collectUsages(node.body);

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

function extractLocalVariablesFromAST(sourceFile: ts.SourceFile): DeclarationInfo[] {
  const unusedVariables: DeclarationInfo[] = [];

  function visit(node: ts.Node) {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)
    ) {
      if (!node.body) return;

      const declaredVariables = new Map<string, { line: number; node: ts.VariableDeclaration }>();
      const usedIdentifiers = new Set<string>();

      function collectVariables(n: ts.Node) {
        if (ts.isVariableStatement(n)) {
          n.declarationList.declarations.forEach((decl) => {
            if (ts.isIdentifier(decl.name)) {
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
          const parent = n.parent;
          if (parent && !ts.isVariableDeclaration(parent)) {
            usedIdentifiers.add(n.text);
          }
        }
        ts.forEachChild(n, collectUsages);
      }

      collectVariables(node.body);
      collectUsages(node.body);

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

function extractUsedIdentifiersFromAST(sourceFile: ts.SourceFile): Set<string> {
  const usedIdentifiers = new Set<string>();

  function isDeclarationName(node: ts.Node): boolean {
    const parent = node.parent;
    if (!parent) return false;

    if (ts.isImportClause(parent) || ts.isImportSpecifier(parent) || ts.isNamespaceImport(parent)) {
      return true;
    }

    if (ts.isBindingElement(parent)) {
      return parent.name === node;
    }

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

    if (ts.isPropertyAssignment(parent)) {
      return parent.name === node;
    }

    if (ts.isPropertySignature(parent) || ts.isPropertyDeclaration(parent)) {
      return parent.name === node;
    }

    return false;
  }

  function visit(astNode: ts.Node) {
    if (ts.isImportDeclaration(astNode)) {
      return;
    }

    if (ts.isInterfaceDeclaration(astNode) || ts.isTypeAliasDeclaration(astNode)) {
      astNode.getChildren(sourceFile).forEach((child) => {
        if (child !== astNode.name) {
          visit(child);
        }
      });
      return;
    }

    if (ts.isIdentifier(astNode) && !isDeclarationName(astNode)) {
      usedIdentifiers.add(astNode.text);
    }

    astNode.getChildren(sourceFile).forEach(visit);
  }

  visit(sourceFile);
  return usedIdentifiers;
}

function extractComponentPropsFromAST(sourceFile: ts.SourceFile): ComponentPropsInfo[] {
  const componentsInfo: ComponentPropsInfo[] = [];

  function isComponentFunction(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction): boolean {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return /^[A-Z]/.test(node.name.text);
    }

    if ((ts.isFunctionExpression(node) || ts.isArrowFunction(node)) && node.parent) {
      if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
        return /^[A-Z]/.test(node.parent.name.text);
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

  function extractPropsFromType(typeNode: ts.TypeNode | undefined, sourceFile: ts.SourceFile): string[] {
    if (!typeNode) return [];

    const props: string[] = [];

    if (ts.isTypeLiteralNode(typeNode)) {
      typeNode.members.forEach((member) => {
        if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
          props.push(member.name.text);
        }
      });
      return props;
    }

    if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
      const typeName = typeNode.typeName.text;

      sourceFile.statements.forEach((statement) => {
        if (ts.isInterfaceDeclaration(statement) && statement.name.text === typeName) {
          statement.members.forEach((member) => {
            if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
              props.push(member.name.text);
            }
          });
        }

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

  function extractDestructuredProps(param: ts.ParameterDeclaration): string[] {
    const props: string[] = [];

    if (ts.isObjectBindingPattern(param.name)) {
      param.name.elements.forEach((element) => {
        if (ts.isIdentifier(element.name)) {
          props.push(element.name.text);
        }
      });
    }

    return props;
  }

  function extractPropsUsage(body: ts.Node | undefined, propsParamName: string): string[] {
    if (!body) return [];

    const usedProps: string[] = [];

    function visit(node: ts.Node) {
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
    if (!firstParam) return;

    const line = getLineNumber(sourceFile, node);
    const declaredProps = extractPropsFromType(firstParam.type, sourceFile);
    if (declaredProps.length === 0) return;

    const destructuredProps = extractDestructuredProps(firstParam);
    const propsParamName = ts.isIdentifier(firstParam.name) ? firstParam.name.text : 'props';
    const propsUsage = extractPropsUsage(node.body, propsParamName);
    const usedPropsSet = new Set([...destructuredProps, ...propsUsage]);

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

function extractFunctionArgumentsFromAST(sourceFile: ts.SourceFile): FunctionArgumentsInfo[] {
  const functionsInfo: FunctionArgumentsInfo[] = [];

  function isComponentFunction(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction): boolean {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return /^[A-Z]/.test(node.name.text);
    }

    if ((ts.isFunctionExpression(node) || ts.isArrowFunction(node)) && node.parent) {
      if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
        return /^[A-Z]/.test(node.parent.name.text);
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

  function extractParameterNames(param: ts.ParameterDeclaration): string[] {
    const names: string[] = [];

    if (ts.isIdentifier(param.name)) {
      names.push(param.name.text);
    } else if (ts.isObjectBindingPattern(param.name)) {
      param.name.elements.forEach((element) => {
        if (ts.isIdentifier(element.name)) {
          names.push(element.name.text);
        }
      });
    } else if (ts.isArrayBindingPattern(param.name)) {
      param.name.elements.forEach((element) => {
        if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
          names.push(element.name.text);
        }
      });
    }

    return names;
  }

  function isIdentifierUsedInBody(body: ts.Node | undefined, identifierName: string): boolean {
    if (!body) return false;

    let isUsed = false;

    function visit(node: ts.Node) {
      if (ts.isParameter(node)) return;

      if (ts.isIdentifier(node) && node.text === identifierName) {
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
    if (isComponentFunction(node)) return;

    const functionName = getFunctionName(node);
    if (!functionName) return;

    const parameters = node.parameters;
    if (parameters.length === 0) return;

    const line = getLineNumber(sourceFile, node);
    const argumentsInfo: ArgumentInfo[] = [];

    parameters.forEach((param) => {
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
