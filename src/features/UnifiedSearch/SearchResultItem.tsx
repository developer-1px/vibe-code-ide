/**
 * Search Result Item Component
 */

import React, { forwardRef } from 'react';
import { File, Code2, Database, Zap, Calculator, Shield, Box } from 'lucide-react';
import type { SearchResult } from '../../store/atoms';

interface SearchResultItemProps {
  result: SearchResult;
  isFocused: boolean;
  onClick: () => void;
}

export const SearchResultItem = forwardRef<HTMLDivElement, SearchResultItemProps>(
  ({ result, isFocused, onClick }, ref) => {
    const getIcon = () => {
      if (result.type === 'file') {
        return <File className="w-2.5 h-2.5 text-blue-400" />;
      }

      // Symbol icons based on node type
      switch (result.nodeType) {
        case 'function':
          return <Code2 className="w-2.5 h-2.5 text-cyan-400" />;
        case 'variable':
          return <Box className="w-2.5 h-2.5 text-amber-400" />;
        case 'file':
          return <File className="w-2.5 h-2.5 text-blue-400" />;
        default:
          return <Box className="w-2.5 h-2.5 text-slate-400" />;
      }
    };

    const getTypeLabel = () => {
      if (result.type === 'file') return 'FILE';
      return result.nodeType?.toUpperCase() || 'SYMBOL';
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`
          flex items-center gap-2 px-2.5 py-1 cursor-pointer transition-colors
          ${isFocused ? 'bg-vibe-accent/20 border-l-2 border-vibe-accent' : 'hover:bg-white/5'}
        `}
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          {getIcon()}
        </div>

        {/* Name and Metadata */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="text-[11px] text-slate-100 font-mono font-semibold truncate">
            {result.name}
          </div>
          {/* Type Info */}
          {result.typeInfo && (
            <div className="text-[9px] text-cyan-400/70 font-mono truncate">
              {result.typeInfo}
            </div>
          )}
          {/* Code Snippet */}
          {result.codeSnippet && (
            <div className="text-[9px] text-slate-600 font-mono truncate">
              {result.codeSnippet}
            </div>
          )}
        </div>

        {/* File and Line - Only show for symbols */}
        {result.type === 'symbol' && (
          <div className="flex-shrink-0 flex flex-col gap-1 items-end">
            <span className="text-[9px] text-slate-500 font-mono">
              {result.filePath.split('/').pop()}
              {result.lineNumber && `:${result.lineNumber}`}
            </span>
            {/* Usage Count */}
            {result.usageCount !== undefined && result.usageCount > 0 && (
              <span className="text-[8px] bg-vibe-accent/10 border border-vibe-accent/30 px-1.5 py-0.5 rounded text-vibe-accent font-mono">
                {result.usageCount} {result.usageCount === 1 ? 'usage' : 'usages'}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

SearchResultItem.displayName = 'SearchResultItem';
