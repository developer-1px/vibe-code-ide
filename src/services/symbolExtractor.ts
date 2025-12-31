/**
 * Symbol Extractor - Extract searchable symbols from parsed AST nodes
 */

import type { VariableNode } from '../entities/SourceFileNode';
import type { SearchResult, SymbolMetadata } from '../store/atoms';

/**
 * Node types to exclude from symbol search
 */
const EXCLUDED_NODE_TYPES = new Set([
  'template', // TEMPLATE_ROOT, JSX_ROOT, FILE_ROOT
]);

/**
 * Extract searchable symbols from the node map
 * Returns symbols sorted by name for consistent ordering
 */
export function extractSearchableSymbols(
  fullNodeMap: Map<string, VariableNode>,
  symbolMetadata: Map<string, SymbolMetadata>
): SearchResult[] {
  console.log('[extractSearchableSymbols] fullNodeMap size:', fullNodeMap.size, 'symbolMetadata size:', symbolMetadata.size);
  const symbols: SearchResult[] = [];

  fullNodeMap.forEach((node) => {
    // Skip excluded node types
    if (EXCLUDED_NODE_TYPES.has(node.type)) {
      return;
    }

    // Skip root nodes (TEMPLATE_ROOT, JSX_ROOT, FILE_ROOT)
    if (
      node.id.endsWith('::TEMPLATE_ROOT') ||
      node.id.endsWith('::JSX_ROOT') ||
      node.id.endsWith('::FILE_ROOT')
    ) {
      return;
    }

    // Extract symbol name from node label
    const name = node.label;

    // Get metadata for this symbol
    const metadata = symbolMetadata.get(node.id);

    symbols.push({
      id: `symbol-${node.id}`,
      type: 'symbol',
      name,
      filePath: node.filePath,
      nodeType: node.type,
      nodeId: node.id,
      lineNumber: node.startLine,
      score: 0, // Will be calculated during search
      // Enriched metadata
      typeInfo: metadata?.typeInfo || undefined,
      codeSnippet: metadata?.codeSnippet || undefined,
      usageCount: metadata?.usageCount || 0,
    });
  });

  // Sort by name for consistent ordering
  console.log('[extractSearchableSymbols] Extracted symbols:', symbols.length);
  return symbols.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Extract file paths from the files record
 * Returns file search results sorted alphabetically
 */
export function extractSearchableFiles(
  files: Record<string, string>
): SearchResult[] {
  const fileResults: SearchResult[] = [];

  Object.keys(files).forEach((filePath) => {
    // Extract file name from path
    const fileName = filePath.split('/').pop() || filePath;

    fileResults.push({
      id: `file-${filePath}`,
      type: 'file',
      name: fileName,
      filePath,
      score: 0, // Will be calculated during search
    });
  });

  // Sort by file path for consistent ordering
  return fileResults.sort((a, b) => a.filePath.localeCompare(b.filePath));
}
