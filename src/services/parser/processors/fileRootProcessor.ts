import { VariableNode } from '../../../entities/VariableNode';
import { LocalReferenceData } from '../types';

/**
 * Process regular TS file and create FILE_ROOT node
 * FILE_ROOT represents the entire file and shows all exported functions/variables
 * Individual function returns are already extracted in Step 4 by extractReturnStatements
 */
export function processFileRoot(
  filePath: string,
  scriptContent: string,
  localDefs: Set<string>,
  ast: any,
  nodes: Map<string, VariableNode>
): string {
  const fileRootId = `${filePath}::FILE_ROOT`;

  // Get all exported nodes defined at FILE LEVEL (not nested inside functions)
  // localDefs contains only file-level variables, not function-local variables
  const fileNodes = Array.from(nodes.values()).filter(
    (n) =>
      n.filePath === filePath &&
      n.id !== fileRootId &&
      n.type !== 'module' &&
      localDefs.has(n.label) // Only file-level variables, exclude function-local ones
  );

  // FILE_ROOT depends on all exported items in the file
  const dependencies = fileNodes.map((n) => n.id);

  // Convert exported nodes to LocalReference format for UI display
  const localReferences: LocalReferenceData[] = fileNodes.map((n) => {
    // Create export signature (codeSnippet has been replaced with return statement in Step 4)
    const exportSummary =
      n.type === 'function'
        ? `export function ${n.label}(...) { ... }`
        : `export const ${n.label} = ...`;

    return {
      name: n.label,
      nodeId: n.id,
      summary: exportSummary,
      type: n.type,
    };
  });

  const fileName = filePath.split('/').pop() || 'File';
  const fileRootNode: VariableNode = {
    id: fileRootId,
    label: `${fileName}`,
    filePath,
    type: 'module',
    codeSnippet: `// ${fileName}\n// This file exports ${fileNodes.length} item${fileNodes.length !== 1 ? 's' : ''}`,
    startLine: 1,
    dependencies,
    localReferences: localReferences.length > 0 ? localReferences : undefined,
  };

  nodes.set(fileRootId, fileRootNode);
  return fileRootId;
}
