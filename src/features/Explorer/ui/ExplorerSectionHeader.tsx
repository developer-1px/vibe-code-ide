import { ChevronDown, ChevronRight } from 'lucide-react';

interface ExplorerSectionHeaderProps {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

export function ExplorerSectionHeader({ isCollapsed, toggleCollapsed }: ExplorerSectionHeaderProps) {
  function handleClick() {
    toggleCollapsed();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full h-8 items-center justify-between border-b border-border-DEFAULT px-2 flex-shrink-0 hover:bg-bg-deep transition-colors"
    >
      <span className="text-2xs font-medium text-text-tertiary normal-case">Project</span>
      {isCollapsed ? (
        <ChevronRight className="w-3 h-3 text-text-muted" />
      ) : (
        <ChevronDown className="w-3 h-3 text-text-muted" />
      )}
    </button>
  );
}
