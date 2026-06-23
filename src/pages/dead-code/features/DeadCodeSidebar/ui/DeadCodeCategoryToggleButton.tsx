import { ChevronDown, ChevronRight } from 'lucide-react';
import type React from 'react';
import type { CategoryKey } from '@/pages/dead-code/features/DeadCodeSidebar/model/categoryState';
import { renderCategoryIcon } from '@/pages/shared/features/DeadCode/lib/categoryUtils.tsx';

interface DeadCodeCategoryToggleButtonProps {
  title: string;
  itemCount: number;
  categoryKey: CategoryKey;
  isExpanded: boolean;
  toggleCategory: () => void;
}

export function DeadCodeCategoryToggleButton({
  title,
  itemCount,
  categoryKey,
  isExpanded,
  toggleCategory,
}: DeadCodeCategoryToggleButtonProps) {
  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    toggleCategory();
  }

  return (
    <button type="button" onClick={handleClick} className="flex items-center gap-1.5 flex-1">
      {isExpanded ? (
        <ChevronDown size={14} className="text-text-muted shrink-0" />
      ) : (
        <ChevronRight size={14} className="text-text-muted shrink-0" />
      )}
      {renderCategoryIcon(categoryKey)}
      <span className="text-xs text-text-primary font-medium">{title}</span>
      <span className="text-xs text-text-muted">({itemCount})</span>
    </button>
  );
}
