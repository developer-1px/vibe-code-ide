import { VariableNode } from '../../../entities/VariableNode';
import { LocalReferenceData } from '../types';

/**
 * Extract local variable/function references from a return statement AST node
 */
export function extractLocalReferences(
  returnNode: any,
  fileVarNames: Set<string>,
  filePath: string,
  nodes: Map<string, VariableNode>
): LocalReferenceData[] {
  const localReferences: LocalReferenceData[] = [];
  const foundNames = new Set<string>();
  const seen = new Set<any>();

  // Traverse return expression to find all local variable/function references
  const traverse = (node: any, parent: any = null) => {
    if (!node || typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);

    // Find Identifier nodes that reference local variables
    if (node.type === 'Identifier') {
      const name = node.name;

      // Skip if already found, is a keyword, or is not a local variable
      if (foundNames.has(name)) return;
      if (['true', 'false', 'null', 'undefined', 'this'].includes(name)) return;
      if (!fileVarNames.has(name)) return;

      // Skip object keys in non-computed properties (unless shorthand)
      // Example: { key: value } - 'key' is not a reference
      // But: { layoutNodes } - 'layoutNodes' IS a reference (shorthand)
      if (
        parent?.type === 'ObjectProperty' &&
        parent.key === node &&
        !parent.computed &&
        !parent.shorthand
      ) {
        return;
      }

      // Skip property access in non-computed member expressions
      // Example: obj.property - 'property' is not a reference
      if (
        (parent?.type === 'MemberExpression' ||
          parent?.type === 'OptionalMemberExpression') &&
        parent.property === node &&
        !parent.computed
      ) {
        return;
      }

      foundNames.add(name);

      // Find the corresponding node
      const nodeId = `${filePath}::${name}`;
      const varNode = nodes.get(nodeId);

      if (varNode) {
        // Create 1-line summary (first line of code snippet)
        const summary = varNode.codeSnippet.split('\n')[0].trim();

        localReferences.push({
          name,
          nodeId: varNode.id,
          summary,
          type: varNode.type,
        });
      } else {
        // Variable not found in nodes Map (shouldn't happen now, but just in case)
        console.warn(`[extractLocalReferences] Variable "${name}" not found in nodes Map`);
      }
    }

    // Recursively traverse children with parent tracking
    for (const key in node) {
      if (['loc', 'start', 'end', 'comments', 'extra', 'type'].includes(key)) continue;
      const value = node[key];

      if (Array.isArray(value)) {
        value.forEach((item) => traverse(item, node));
      } else if (typeof value === 'object') {
        traverse(value, node);
      }
    }
  };

  traverse(returnNode);

  return localReferences;
}
