/**
 * Dead Code Selection Hook
 */
import { useAtom } from 'jotai';
import { getDeadCodeItemKey } from '@/entities/DeadCode/lib/computed';
import type { DeadCodeItem } from '@/entities/DeadCode/model/types';
import { selectedDeadCodeItemsAtom } from '@/pages/shared/features/DeadCode/model/atoms.ts';

export function useDeadCodeSelection() {
  const [selectedItems, setSelectedItems] = useAtom(selectedDeadCodeItemsAtom);

  const toggleItemSelection = (item: DeadCodeItem) => {
    const key = getDeadCodeItemKey(item);
    const newSelected = new Set(selectedItems);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedItems(newSelected);
  };

  const toggleCategorySelection = (items: DeadCodeItem[]) => {
    const allSelected = items.every((item) => selectedItems.has(getDeadCodeItemKey(item)));
    const newSelected = new Set(selectedItems);

    if (allSelected) {
      // Deselect all in this category
      items.forEach((item) => {
        newSelected.delete(getDeadCodeItemKey(item));
      });
    } else {
      // Select all in this category
      items.forEach((item) => {
        newSelected.add(getDeadCodeItemKey(item));
      });
    }

    setSelectedItems(newSelected);
  };

  const isItemSelected = (item: DeadCodeItem) => {
    return selectedItems.has(getDeadCodeItemKey(item));
  };

  const isCategoryAllSelected = (items: DeadCodeItem[]) => {
    return items.length > 0 && items.every((item) => selectedItems.has(getDeadCodeItemKey(item)));
  };

  const isCategorySomeSelected = (items: DeadCodeItem[]) => {
    const allSelected = isCategoryAllSelected(items);
    return items.some((item) => selectedItems.has(getDeadCodeItemKey(item))) && !allSelected;
  };

  return {
    selectedItems,
    toggleItemSelection,
    toggleCategorySelection,
    isItemSelected,
    isCategoryAllSelected,
    isCategorySomeSelected,
  };
}
