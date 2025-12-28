import { VariableNode } from '../../../entities/VariableNode';
import { findReturnInSingleFunction } from '../ast/returnExtractor';
import { extractLocalReferences } from '../ast/localReferenceExtractor';
import { isPureFunction } from '../utils/purityChecker';

/**
 * Extract all local variables declared within a function body and create VariableNodes
 */
function extractFunctionLocalVariables(
  functionNode: any,
  filePath: string,
  scriptContent: string,
  startLineOffset: number,
  nodes: Map<string, VariableNode>
): Set<string> {
  const localVars = new Set<string>();
  const seen = new Set<any>();

  const traverse = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);

    // Find variable declarations
    if (node.type === 'VariableDeclaration') {
      node.declarations?.forEach((decl: any) => {
        const extractVariable = (name: string, declNode: any) => {
          localVars.add(name);

          // Create VariableNode for this local variable
          const nodeId = `${filePath}::${name}`;

          // Skip if already exists
          if (nodes.has(nodeId)) return;

          // Extract code snippet and line number
          let codeSnippet = '';
          let startLine = 0;

          if (decl.loc) {
            const declStartLine = decl.loc.start.line;
            const declEndLine = decl.loc.end.line;

            let currentOffset = 0;
            for (let i = 1; i < declStartLine; i++) {
              const nextNewline = scriptContent.indexOf('\n', currentOffset);
              if (nextNewline === -1) break;
              currentOffset = nextNewline + 1;
            }
            const snippetStartOffset = currentOffset;

            let endOffset = currentOffset;
            for (let i = declStartLine; i <= declEndLine; i++) {
              const nextNewline = scriptContent.indexOf('\n', endOffset);
              if (nextNewline === -1) {
                endOffset = scriptContent.length;
                break;
              }
              if (i === declEndLine) {
                endOffset = nextNewline;
              } else {
                endOffset = nextNewline + 1;
              }
            }

            codeSnippet = scriptContent.substring(snippetStartOffset, endOffset);
            startLine = declStartLine + startLineOffset;
          }

          // Determine type (ref, computed, etc.)
          let varType: VariableNode['type'] = 'ref';
          if (decl.init) {
            const initCode = codeSnippet;
            if (initCode.includes('useState')) varType = 'ref';
            else if (initCode.includes('useMemo') || initCode.includes('useCallback')) varType = 'computed';
            else if (initCode.match(/use[A-Z]/)) varType = 'hook';
          }

          const variableNode: VariableNode = {
            id: nodeId,
            label: name,
            filePath,
            type: varType,
            codeSnippet: codeSnippet || `const ${name} = ...`,
            startLine,
            dependencies: [],
            astNode: declNode,
          };

          nodes.set(nodeId, variableNode);
        };

        if (decl.id?.type === 'Identifier') {
          extractVariable(decl.id.name, decl);
        } else if (decl.id?.type === 'ArrayPattern') {
          // Handle array destructuring: const [a, b] = ...
          decl.id.elements?.forEach((elem: any) => {
            if (elem?.type === 'Identifier') {
              extractVariable(elem.name, decl);
            }
          });
        } else if (decl.id?.type === 'ObjectPattern') {
          // Handle object destructuring: const { a, b } = ...
          decl.id.properties?.forEach((prop: any) => {
            if (prop.value?.type === 'Identifier') {
              extractVariable(prop.value.name, decl);
            }
          });
        }
      });
    }

    // Recursively traverse
    for (const key in node) {
      if (['loc', 'start', 'end', 'comments', 'extra', 'type'].includes(key)) continue;
      const value = node[key];

      if (Array.isArray(value)) {
        value.forEach(traverse);
      } else if (typeof value === 'object') {
        traverse(value);
      }
    }
  };

  // Start from function body
  if (functionNode.body) {
    traverse(functionNode.body);
  }

  return localVars;
}

/**
 * Extract return statements for all function nodes in a file
 * Replaces function body with just the return statement for better visualization
 */
export function extractReturnStatements(
  filePath: string,
  scriptContent: string,
  localDefs: Set<string>,
  startLineOffset: number,
  nodes: Map<string, VariableNode>
): void {
  nodes.forEach((node) => {
    if (node.filePath === filePath && !node.id.includes('_stmt_')) {
      // Skip module nodes (FILE_ROOT, JSX_ROOT, TEMPLATE_ROOT)
      // Module nodes should only show exports, not local variables
      if (node.type === 'module' || node.type === 'template') {
        return;
      }

      // @ts-ignore
      const astNode = node.astNode;

      if (
        astNode &&
        (astNode.type === 'ArrowFunctionExpression' ||
          astNode.type === 'FunctionExpression' ||
          astNode.type === 'FunctionDeclaration')
      ) {
        // Check if function is pure
        const isPure = isPureFunction(astNode);

        // Mark pure functions with 'pure-function' type
        if (isPure && (node.type === 'function' || node.type === 'hook')) {
          node.type = 'pure-function';
          console.log(`✨ Pure function detected: ${node.label} - showing full code`);
        }

        // For pure functions: skip return extraction and show full code
        if (isPure) {
          return; // Skip to next node
        }

        // Extract local variables only for impure functions (functions with side effects)
        // Pure functions don't need local variable tracking as they have no side effects
        const functionLocalVars = extractFunctionLocalVariables(
          astNode,
          filePath,
          scriptContent,
          startLineOffset,
          nodes
        );

        const allVars = new Set([...localDefs, ...functionLocalVars]);

        const returnNode = findReturnInSingleFunction(astNode);
        if (returnNode) {
          const fullCode = scriptContent;

          // Extract return statement snippet
          let returnSnippet = node.codeSnippet;
          let returnStartLine = node.startLine;

          if (returnNode.loc) {
            const startLine = returnNode.loc.start.line;
            const endLine = returnNode.loc.end.line;

            let currentOffset = 0;
            for (let i = 1; i < startLine; i++) {
              const nextNewline = fullCode.indexOf('\n', currentOffset);
              if (nextNewline === -1) break;
              currentOffset = nextNewline + 1;
            }
            const snippetStartOffset = currentOffset;

            let endOffset = currentOffset;
            for (let i = startLine; i <= endLine; i++) {
              const nextNewline = fullCode.indexOf('\n', endOffset);
              if (nextNewline === -1) {
                endOffset = fullCode.length;
                break;
              }
              if (i === endLine) {
                endOffset = nextNewline;
              } else {
                endOffset = nextNewline + 1;
              }
            }

            returnSnippet = fullCode.substring(snippetStartOffset, endOffset);
            returnStartLine = startLine + startLineOffset;

            // Extract local references (including function-local variables)
            const localReferences = extractLocalReferences(
              returnNode,
              allVars,
              filePath,
              nodes
            );

            // Create condensed format: signature { ... return ... }
            const originalLines = node.codeSnippet.split('\n');
            const signature = originalLines[0]; // First line (function signature)

            // Build condensed snippet
            const condensedSnippet = `${signature}\n  ...\n\n${returnSnippet}\n}`;

            // Update node
            node.codeSnippet = condensedSnippet;
            node.startLine = node.startLine; // Keep original start line (signature line)
            if (localReferences.length > 0) {
              node.localReferences = localReferences;
            }
          }
        }
      }
    }
  });
}
