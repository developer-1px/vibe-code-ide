/**
 * DependenciesSection - Display imported symbols with icons and paths
 * Import된 심볼들을 아이콘과 경로와 함께 표시 (GitBook 스타일)
 */

import React, { useState } from 'react';
import { Box, Code, Type, Database, Braces, FileCode, Layers, Package, ChevronDown, ChevronRight } from 'lucide-react';
import type { ImportSymbol, SymbolKind } from '../lib/types';

interface DependenciesSectionProps {
  imports: ImportSymbol[];
}

/**
 * Get icon component for symbol kind
 */
function getSymbolIcon(kind: SymbolKind) {
  switch (kind) {
    case 'function':
      return Code;
    case 'type':
    case 'interface':
      return Type;
    case 'const':
      return Database;
    case 'component':
      return Box;
    case 'hook':
      return Braces;
    case 'class':
      return Layers;
    case 'enum':
      return FileCode;
    default:
      return Package;
  }
}

/**
 * Get color class for symbol kind
 */
function getSymbolColor(kind: SymbolKind): string {
  switch (kind) {
    case 'function':
      return 'text-blue-500';
    case 'type':
    case 'interface':
      return 'text-purple-500';
    case 'const':
      return 'text-green-500';
    case 'component':
      return 'text-warm-500';
    case 'hook':
      return 'text-cyan-500';
    case 'class':
      return 'text-yellow-600';
    case 'enum':
      return 'text-pink-500';
    default:
      return 'text-text-muted';
  }
}

/**
 * Import Symbol Badge (inline, compact, subtle)
 */
const ImportSymbolBadge = ({ symbol }: { symbol: ImportSymbol }) => {
  const Icon = getSymbolIcon(symbol.kind);
  const colorClass = getSymbolColor(symbol.kind);

  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group">
      <Icon size={12} className={`${colorClass} group-hover:text-blue-500 transition-colors`} />
      <span className="font-mono text-xs font-bold text-gray-700 group-hover:text-gray-900 transition-colors">{symbol.name}</span>
    </span>
  );
};

const DependenciesSection = ({ imports }: DependenciesSectionProps) => {
  // If no imports, don't render
  if (imports.length === 0) {
    return null;
  }

  // deps 개수에 따라 초기 상태 결정 (8개 미만이면 펼치고, 8개 이상이면 접기)
  const [isExpanded, setIsExpanded] = useState(imports.length < 8);

  return (
    <section className="mb-24">
      {/* Section title - clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 hover:text-gray-600 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-gray-400" />
        ) : (
          <ChevronRight className="w-3 h-3 text-gray-400" />
        )}
        <Package className="w-3 h-3 text-gray-400" />
        <span>Dependencies</span>
        <span className="text-gray-300 font-light">|</span>
        <span className="text-gray-400 font-normal">{imports.length} modules</span>
      </button>

      {/* Import badges - 가로로 한 줄 */}
      {isExpanded && (
        <div className="flex flex-wrap gap-2 items-center">
          {imports.map((symbol, idx) => (
            <ImportSymbolBadge key={`${symbol.name}-${idx}`} symbol={symbol} />
          ))}
        </div>
      )}
    </section>
  );
};

export default DependenciesSection;
