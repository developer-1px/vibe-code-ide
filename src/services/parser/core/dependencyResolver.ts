import { VariableNode } from '../../../entities/VariableNode';
import { findDependenciesInAST } from '../astUtils';

/**
 * Resolve dependencies for all nodes in a file
 * Uses AST to find local variable references and link them
 */
export function resolveDependencies(
  filePath: string,
  localDefs: Set<string>,
  nodes: Map<string, VariableNode>
): void {
  // Collect all variable names in this file (both file-level and function-local)
  const allVarNames = new Set<string>();
  nodes.forEach((n) => {
    if (n.filePath === filePath && n.type !== 'module' && n.type !== 'template') {
      allVarNames.add(n.label);
    }
  });

  nodes.forEach((node) => {
    if (node.filePath === filePath && node.type !== 'template') {
      // @ts-ignore - astNode is attached temporarily during parsing
      if (node.astNode) {
        // @ts-ignore - Use allVarNames instead of just localDefs
        const deps = findDependenciesInAST(node.astNode, allVarNames, node.id);
        // Add deps: convert local name to local ID
        deps.forEach((dName) => {
          const dId = `${filePath}::${dName}`;
          if (nodes.has(dId) && !node.dependencies.includes(dId)) {
            node.dependencies.push(dId);
          }
        });
      }
    }
  });
}
