import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { FileExplorer } from './FileExplorer';

interface RelatedFilesSectionProps {
  title: string;
  count: number;
  files: Record<string, string>;
}

export function RelatedFilesSection({ title, count, files }: RelatedFilesSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  function handleToggle() {
    setIsCollapsed(!isCollapsed);
  }

  return (
    <div className={isCollapsed ? '' : 'flex-1 min-h-0 flex flex-col overflow-hidden'}>
      <button
        onClick={handleToggle}
        className="flex w-full h-8 items-center justify-between border-b border-border-DEFAULT px-2 flex-shrink-0 hover:bg-bg-deep transition-colors"
      >
        <span className="text-2xs font-medium text-text-tertiary normal-case">
          {title} ({count})
        </span>
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3 text-text-muted" />
        ) : (
          <ChevronDown className="w-3 h-3 text-text-muted" />
        )}
      </button>
      {!isCollapsed && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <FileExplorer filteredFiles={files} />
        </div>
      )}
    </div>
  );
}
