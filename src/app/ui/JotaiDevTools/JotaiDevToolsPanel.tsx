import { ChevronDown } from 'lucide-react';
import React from 'react';

export interface AtomUpdate {
  name: string;
  value: unknown;
  timestamp: number;
  id: string;
}

interface JotaiDevToolsPanelProps {
  updateHistory: AtomUpdate[];
  closeDevTools: () => void;
}

export function JotaiDevToolsPanel({ updateHistory, closeDevTools }: JotaiDevToolsPanelProps) {
  function handleCloseClick() {
    closeDevTools();
  }

  return (
    <div className="fixed top-0 right-0 bg-slate-900/95 border-l border-slate-700 shadow-2xl w-96 h-screen overflow-hidden flex flex-col z-50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-purple-400">Jotai DevTools</span>
          <span className="text-2xs text-slate-500">({updateHistory.length} updates)</span>
        </div>
        <button onClick={handleCloseClick} className="text-slate-400 hover:text-slate-200 transition-colors">
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Update History - Most Recent First */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
        {updateHistory.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-4">No updates yet</div>
        ) : (
          <div className="space-y-1">
            {updateHistory.map((update, index) => (
              <AtomUpdateItem key={update.id} update={update} isFirst={index === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const AtomUpdateItem: React.FC<{ update: AtomUpdate; isFirst: boolean }> = ({ update, isFirst }) => {
  const { name, value, timestamp } = update;

  const valuePreview = React.useMemo(() => {
    try {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (typeof value === 'string') return value.length > 50 ? `"${value.substring(0, 50)}..."` : `"${value}"`;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      if (typeof value === 'function') return '[Function]';
      if (Array.isArray(value)) return `Array(${value.length})`;
      if (value instanceof Set) return `Set(${value.size})`;
      if (value instanceof Map) return `Map(${value.size})`;
      if (typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 0) return '{}';
        if (keys.length <= 2) {
          return `{${keys.join(', ')}}`;
        }
        return `{${keys.length} keys}`;
      }
      return String(value);
    } catch {
      return '[Error]';
    }
  }, [value]);

  const timeStr = new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });

  return (
    <div
      className={`flex items-center justify-between gap-2 px-2 py-1 rounded ${isFirst ? 'bg-purple-900/30 border border-purple-500/50' : 'bg-slate-800/50 border border-slate-700/50'}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="text-[9px] text-slate-500 font-mono flex-shrink-0">{timeStr}</div>
        <div className="text-2xs font-semibold text-purple-300 flex-shrink-0">{name}</div>
      </div>
      <div className="text-2xs text-slate-400 font-mono truncate flex-shrink-0 max-w-[150px]">{valuePreview}</div>
    </div>
  );
};
