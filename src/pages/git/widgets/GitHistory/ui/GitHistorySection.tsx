import { ChevronDown, ChevronRight, GitCommit } from 'lucide-react';
import { useState } from 'react';
import type { Commit } from '../../../model/types';

export function GitHistorySection({ commits }: { commits: Commit[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  function handleToggle() {
    setIsExpanded(!isExpanded);
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-1 px-1 py-1 hover:bg-white/5 rounded transition-colors"
      >
        {isExpanded ? (
          <ChevronDown size={14} className="text-text-muted" />
        ) : (
          <ChevronRight size={14} className="text-text-muted" />
        )}
        <span className="text-xs font-medium text-text-primary flex-1 text-left">Recent Commits</span>
        <span className="text-xs text-text-muted">{commits.length}</span>
      </button>

      {isExpanded && (
        <div className="ml-2 space-y-1">
          {commits.map((commit) => (
            <div key={commit.hash} className="px-2 py-1.5 hover:bg-white/5 rounded transition-colors cursor-pointer">
              <div className="flex items-start gap-2">
                <GitCommit size={12} className="text-warm-300 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary line-clamp-2">{commit.message}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-2xs text-text-muted">
                    <span className="font-mono">{commit.hash}</span>
                    <span>•</span>
                    <span>{commit.author}</span>
                    <span>•</span>
                    <span>{commit.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
