
import React, { useMemo } from 'react';
import { CanvasNode } from '../../CanvasNode';

// Lib - Pure Utilities
import { extractTokenRanges } from '../lib/tokenUtils.ts';
import { processCodeLines } from '../lib/lineUtils.ts';
import { getNodeBorderColor } from '../lib/styleUtils.ts';

// UI Components
import CodeCardHeader from './components/CodeCardHeader.tsx';
import CodeCardCopyButton from './components/CodeCardCopyButton.tsx';
import CodeCardLine from './components/CodeCardLine.tsx';
import LocalReferenceItem from './components/LocalReferenceItem.tsx';

interface CodeCardProps {
  node: CanvasNode;
}

const CodeCard: React.FC<CodeCardProps> = ({ node }) => {
  const isTemplate = node.type === 'template';

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
      <CodeCardHeader node={node} />

      {/* Local References (for JSX_ROOT only) */}
      {node.localReferences && node.localReferences.length > 0 && (
        <div className="flex flex-col gap-0.5 bg-[#0d1526] border-y border-white/5 py-2">
          <div className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
            Local References
          </div>
          {node.localReferences.map((ref, idx) => (
            <LocalReferenceItem key={`${ref.nodeId}-${idx}`} reference={ref} />
          ))}
        </div>
      )}

      {/* Body: Render Lines from Processed Data */}
      <div className={`flex flex-col bg-[#0b1221] py-2 ${node.localReferences && node.localReferences.length > 0 ? 'rounded-b-lg' : 'rounded-b-lg'}`}>
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
