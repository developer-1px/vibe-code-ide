interface JsonExplorerColumnItemProps {
  column: string;
  selectColumn?: (column: string) => void;
  scrollToColumn?: (column: string) => void;
}

export function JsonExplorerColumnItem({ column, selectColumn, scrollToColumn }: JsonExplorerColumnItemProps) {
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
