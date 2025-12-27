
import React, { useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { CanvasNode } from '../../CanvasNode';

// Extracted Logic
import { extractTokenRanges } from '../lib/tokenUtils.ts';
import { processCodeLines } from '../lib/lineUtils.ts';
import { getNodeBorderColor } from '../lib/styleUtils.ts';

// UI Components
import CodeCardHeader from './components/CodeCardHeader.tsx';
import CodeCardCopyButton from './components/CodeCardCopyButton.tsx';
import CodeCardLine from './components/CodeCardLine.tsx';

// Atoms
import { visibleNodeIdsAtom, fullNodeMapAtom, lastExpandedIdAtom } from '../../../store/atoms';

interface CodeCardProps {
  node: CanvasNode;
}

const CodeCard: React.FC<CodeCardProps> = ({ node }) => {
  const [visibleNodeIds, setVisibleNodeIds] = useAtom(visibleNodeIdsAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const setLastExpandedId = useSetAtom(lastExpandedIdAtom);

  const isTemplate = node.type === 'template';

  // Check if all dependencies are expanded
  const allDepsExpanded = useMemo(() => {
    if (node.dependencies.length === 0) return false;
    return node.dependencies.every(depId => visibleNodeIds.has(depId));
  }, [node.dependencies, visibleNodeIds]);

  const handleToggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.dependencies.length === 0) return;

    setVisibleNodeIds(prev => {
      const next = new Set(prev);

      if (!allDepsExpanded) {
        // Expand all dependencies recursively
        const expandRecursive = (id: string) => {
          if (next.has(id)) return;
          next.add(id);

          const depNode = fullNodeMap.get(id);
          if (depNode) {
            // Stop expanding if we hit a template node
            if (depNode.type === 'template') return;

            depNode.dependencies.forEach(depId => {
              if (fullNodeMap.has(depId)) {
                expandRecursive(depId);
              }
            });
          }
        };

        node.dependencies.forEach(depId => {
          if (fullNodeMap.has(depId)) {
            expandRecursive(depId);
          }
        });

        // Center on the first expanded dependency
        if (node.dependencies.length > 0) {
          setLastExpandedId(node.dependencies[0]);
        }
      } else {
        // Collapse all dependencies
        const collapseRecursive = (id: string, toRemove: Set<string>) => {
          toRemove.add(id);
          const depNode = fullNodeMap.get(id);
          if (depNode) {
            depNode.dependencies.forEach(depId => {
              if (fullNodeMap.has(depId)) {
                collapseRecursive(depId, toRemove);
              }
            });
          }
        };

        const toRemove = new Set<string>();
        node.dependencies.forEach(depId => {
          if (fullNodeMap.has(depId)) {
            collapseRecursive(depId, toRemove);
          }
        });

        toRemove.forEach(id => next.delete(id));
      }

      return next;
    });
  };

  // --- 1. Prepare Data (Pure Logic) ---
  const tokenRanges = useMemo(() => {
    return extractTokenRanges(node.codeSnippet, node.id, node.dependencies, isTemplate);
  }, [node.codeSnippet, node.id, node.dependencies, isTemplate]);

  const processedLines = useMemo(() => {
    return processCodeLines(
        node.codeSnippet,
        node.startLine || 1,
        node.id,
        node.dependencies,
        tokenRanges,
        isTemplate,
        node.templateTokenRanges // AST-based token positions for templates
    );
  }, [node.codeSnippet, node.startLine, node.id, node.dependencies, tokenRanges, isTemplate, node.templateTokenRanges]);


  const maxWidthClass = 'max-w-[700px]';

  return (
    <div
      id={`node-${node.visualId || node.id}`}
      className={`
        bg-vibe-panel/95 backdrop-blur-md border shadow-2xl rounded-lg flex flex-col relative group/card overflow-visible transition-colors
        ${getNodeBorderColor(node.type)}
        min-w-[420px] ${maxWidthClass} w-fit cursor-default
      `}
    >
      {/* Header */}
      <CodeCardHeader
        node={node}
        allDepsExpanded={allDepsExpanded}
        onToggleAll={handleToggleAll}
        showToggleButton={node.dependencies.length > 0}
      />

      {/* Body: Render Lines from Processed Data */}
      <div className="flex flex-col bg-[#0b1221] rounded-b-lg py-2">
        {processedLines.map((line, i) => {
          const isDefinitionLine = line.num === node.startLine;
          return (
            <CodeCardLine
              key={i}
              line={line}
              node={node}
              isDefinitionLine={isDefinitionLine}
            />
          );
        })}
      </div>

      {/* Copy Button - Bottom Right */}
      <CodeCardCopyButton codeSnippet={node.codeSnippet} />

      <div className="absolute inset-0 border-2 border-transparent group-hover/card:border-white/5 rounded-lg pointer-events-none transition-colors" />
    </div>
  );
};

export default CodeCard;
