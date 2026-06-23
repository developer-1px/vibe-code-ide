import type React from 'react';
import { useDeadCodeSelection } from '@/pages/dead-code/features/DeadCodeSelection/lib/useDeadCodeSelection.ts';
import type { DeadCodeItem } from '@/pages/shared/features/DeadCode/lib/deadCodeAnalyzer.ts';
import { Checkbox } from '@/shared/ui/Checkbox';

interface DeadCodeResultCheckboxProps {
  item: DeadCodeItem;
}

export function DeadCodeResultCheckbox({ item }: DeadCodeResultCheckboxProps) {
  const { toggleItemSelection, isItemSelected } = useDeadCodeSelection();
  const isSelected = isItemSelected(item);

  function handleCheckedChange() {
    toggleItemSelection(item);
  }

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <Checkbox
      checked={isSelected}
      onCheckedChange={handleCheckedChange}
      className="border-border-hover"
      onClick={handleCheckboxClick}
    />
  );
}
