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
        case 'pure-function':
          return <Calculator className="w-2.5 h-2.5 text-cyan-400" />;
        case 'immutable-data':
          return <Shield className="w-2.5 h-2.5 text-blue-400" />;
        case 'computed':
          return <Code2 className="w-2.5 h-2.5 text-sky-400" />;
        case 'state-ref':
          return <Database className="w-2.5 h-2.5 text-amber-400" />;
        case 'effect-action':
          return <Zap className="w-2.5 h-2.5 text-red-400" />;
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

        {/* Name and Path */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-slate-100 font-mono truncate">
            {result.name}
          </div>
          <div className="text-[9px] text-slate-500 font-mono truncate">
            {result.filePath}
            {result.lineNumber && ` :${result.lineNumber}`}
          </div>
        </div>

        {/* Type Badge */}
        <div className="flex-shrink-0">
          <span className="text-[9px] uppercase tracking-wider bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-400 font-mono">
            {getTypeLabel()}
          </span>
        </div>
      </div>
    );
  }
);

SearchResultItem.displayName = 'SearchResultItem';
