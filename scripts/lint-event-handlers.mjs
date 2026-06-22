import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const projectRoot = path.resolve(import.meta.dirname, '..');
const srcRoot = path.join(projectRoot, 'src');
const handlerNamePattern = /^handle[A-Z0-9]/;
const eventPropPattern = /^on[A-Z]/;
const ignoredPathParts = new Set(['node_modules', 'dist', 'build', 'virtual-types']);

const issues = [];

for (const filePath of collectSourceFiles(srcRoot)) {
  lintFile(filePath);
}

if (issues.length > 0) {
  console.error('Event handler lint failed. Use named function handlers matching handle*.');
  for (const issue of issues) {
    console.error(`${issue.file}:${issue.line}:${issue.column} ${issue.message}`);
  }
  process.exit(1);
}

function collectSourceFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (ignoredPathParts.has(entry)) continue;

    const entryPath = path.join(dir, entry);
    const stat = statSync(entryPath);

    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(entryPath));
      continue;
    }

    if (!/\.(ts|tsx)$/.test(entryPath) || entryPath.endsWith('.d.ts')) continue;
    files.push(entryPath);
  }
  return files;
}

function lintFile(filePath) {
  const sourceText = readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  function visit(node) {
    if (ts.isJsxAttribute(node)) {
      lintJsxAttribute(sourceFile, node);
    }

    if (ts.isCallExpression(node)) {
      lintEventListenerCall(sourceFile, node);
      lintUseHotkeysCall(sourceFile, node);
    }

    if (ts.isVariableDeclaration(node)) {
      lintHandlerVariableDeclaration(sourceFile, node);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function lintJsxAttribute(sourceFile, node) {
  if (!ts.isIdentifier(node.name)) return;

  const propName = node.name.text;
  if (!eventPropPattern.test(propName)) return;

  const expression = getJsxAttributeExpression(node);
  if (!expression) return;

  if (!isValidHandlerExpression(expression)) {
    addIssue(sourceFile, node.name, `JSX ${propName} must reference a handle* function.`);
  }
}

function lintEventListenerCall(sourceFile, node) {
  if (!isPropertyOrIdentifierNamed(node.expression, 'addEventListener')) return;

  const listener = node.arguments[1];
  if (!listener) return;

  if (!isValidHandlerExpression(listener)) {
    addIssue(sourceFile, listener, 'addEventListener listener must reference a handle* function.');
  }
}

function lintUseHotkeysCall(sourceFile, node) {
  if (!ts.isIdentifier(node.expression) || node.expression.text !== 'useHotkeys') return;

  const handler = node.arguments[1];
  if (!handler) return;

  if (!isValidHandlerExpression(handler)) {
    addIssue(sourceFile, handler, 'useHotkeys handler must reference a handle* function.');
  }
}

function lintHandlerVariableDeclaration(sourceFile, node) {
  if (!ts.isIdentifier(node.name) || !handlerNamePattern.test(node.name.text)) return;
  if (!node.initializer) return;

  const initializer = unwrapExpression(node.initializer);
  if (
    ts.isArrowFunction(initializer) ||
    ts.isFunctionExpression(initializer) ||
    isCallNamed(initializer, 'useCallback')
  ) {
    addIssue(sourceFile, node.name, `${node.name.text} must be declared as function ${node.name.text}(...).`);
  }
}

function getJsxAttributeExpression(node) {
  if (!node.initializer) return undefined;
  if (ts.isJsxExpression(node.initializer)) return node.initializer.expression;
  return node.initializer;
}

function isValidHandlerExpression(expression) {
  const unwrapped = unwrapExpression(expression);

  if (ts.isIdentifier(unwrapped)) {
    return handlerNamePattern.test(unwrapped.text);
  }

  if (ts.isConditionalExpression(unwrapped)) {
    return (
      isValidHandlerExpression(unwrapped.whenTrue) &&
      (isValidHandlerExpression(unwrapped.whenFalse) || isEmptyHandlerValue(unwrapped.whenFalse))
    );
  }

  return isEmptyHandlerValue(unwrapped);
}

function unwrapExpression(expression) {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isNonNullExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function isEmptyHandlerValue(expression) {
  const unwrapped = unwrapExpression(expression);
  return (
    unwrapped.kind === ts.SyntaxKind.NullKeyword ||
    (ts.isIdentifier(unwrapped) && unwrapped.text === 'undefined')
  );
}

function isPropertyOrIdentifierNamed(expression, name) {
  if (ts.isIdentifier(expression)) return expression.text === name;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text === name;
  return false;
}

function isCallNamed(expression, name) {
  return ts.isCallExpression(expression) && isPropertyOrIdentifierNamed(expression.expression, name);
}

function addIssue(sourceFile, node, message) {
  const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  issues.push({
    file: path.relative(projectRoot, sourceFile.fileName),
    line: pos.line + 1,
    column: pos.character + 1,
    message,
  });
}
