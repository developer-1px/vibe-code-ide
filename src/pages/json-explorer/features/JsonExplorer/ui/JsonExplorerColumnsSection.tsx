import { ChevronDown, ChevronRight, Columns } from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '@/shared/ui/ScrollArea';

interface JsonExplorerColumnsSectionProps {
  columns: string[];
  selectColumn?: (columnKey: string) => void;
  scrollToColumn?: (columnKey: string) => void;
}

function ColumnItem({
  column,
  selectColumn,
  scrollToColumn,
}: {
  column: string;
  selectColumn?: (column: string) => void;
  scrollToColumn?: (column: string) => void;
}) {
  function handleClick() {
    selectColumn?.(column);
    scrollToColumn?.(column);
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-0.5 text-2xs cursor-pointer hover:bg-warm-500/10 transition-colors"
      onClick={handleClick}
    >
      <div className="w-1 h-1 rounded-full bg-warm-300 shrink-0" />
      <span className="font-mono text-text-secondary truncate">{column}</span>
    </div>
  );
}

export function JsonExplorerColumnsSection({ columns, selectColumn, scrollToColumn }: JsonExplorerColumnsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  function handleToggle() {
    setIsExpanded(!isExpanded);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2 bg-bg-deep border-b border-border-DEFAULT cursor-pointer hover:bg-bg-deep/80 transition-colors shrink-0"
        onClick={handleToggle}
      >
        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Columns size={12} className="text-warm-300" />
        <h2 className="text-xs font-semibold text-text-primary">Columns</h2>
        <span className="text-3xs text-text-tertiary ml-auto">{columns.length}</span>
      </div>

      {isExpanded && (
        <ScrollArea className="flex-1">
          <div className="py-1">
            {columns.map((column) => (
              <ColumnItem key={column} column={column} selectColumn={selectColumn} scrollToColumn={scrollToColumn} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
