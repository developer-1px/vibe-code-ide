/**
 * Category Header Checkbox Component
 */

import type { DeadCodeItem } from '@/pages/shared/features/DeadCode/lib/deadCodeAnalyzer.ts';
import { cn } from '@/shared/lib/utils';
import { Checkbox } from '@/shared/ui/Checkbox';
import { useDeadCodeSelection } from '../lib/useDeadCodeSelection.ts';

export function CategoryCheckbox({ items }: { items: DeadCodeItem[] }) {
  const { toggleCategorySelection, isCategoryAllSelected, isCategorySomeSelected } = useDeadCodeSelection();

  if (items.length === 0) return null;

  const allSelected = isCategoryAllSelected(items);
  const someSelected = isCategorySomeSelected(items);

  function handleCategoryCheckedChange() {
    toggleCategorySelection(items);
  }

  return (
    <Checkbox
      checked={allSelected}
      className={cn(someSelected && 'data-[state=checked]:bg-warm-300/50')}
      onCheckedChange={handleCategoryCheckedChange}
    />
  );
}
