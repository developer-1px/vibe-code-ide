import { VariableNode } from '../../../entities/VariableNode';
import { LocalReferenceData } from '../types';
import { parseVueTemplate } from '../vueTemplateParser';

/**
 * Process Vue template and create TEMPLATE_ROOT node
 */
export function processVueTemplate(
  filePath: string,
  templateContent: string | null,
  templateAst: any,
  templateStartLine: number,
  templateContentOffset: number,
  nodes: Map<string, VariableNode>
): string | null {
  if (!templateContent || !templateAst) return null;

  const templateId = `${filePath}::TEMPLATE_ROOT`;

  // Get all variables defined in this file
  const fileVars = Array.from(nodes.values()).filter((n) => n.filePath === filePath);
  const fileVarNames = new Set(fileVars.map((n) => n.id.split('::').pop()!));

  // Parse template using dedicated parser (adjust offsets to be relative to templateContent)
  const parseResult = parseVueTemplate(templateAst, fileVarNames, templateContentOffset);

  // Create local references from template dependencies
  const localReferences: LocalReferenceData[] = [];
  parseResult.dependencies.forEach((varName) => {
    const nodeId = `${filePath}::${varName}`;
    const varNode = nodes.get(nodeId);

    if (varNode) {
      const summary = varNode.codeSnippet.split('\n')[0].trim();
      localReferences.push({
        name: varName,
        nodeId: varNode.id,
        summary,
        type: varNode.type,
      });
    }
  });

  const fileName = filePath.split('/').pop() || 'Component';
  const templateNode: VariableNode = {
    id: templateId,
    label: `${fileName} <template>`,
    filePath,
    type: 'template',
    codeSnippet: templateContent, // Don't trim! AST offsets are based on original content
    startLine: templateStartLine,
    dependencies: parseResult.dependencies.map((name) => `${filePath}::${name}`),
    localReferences: localReferences.length > 0 ? localReferences : undefined,
    templateTokenRanges: parseResult.tokenRanges.map((range) => ({
      ...range,
      tokenIds: range.tokenIds.map((name: string) => `${filePath}::${name}`),
    })),
  };

  nodes.set(templateId, templateNode);
  return templateId;
}
