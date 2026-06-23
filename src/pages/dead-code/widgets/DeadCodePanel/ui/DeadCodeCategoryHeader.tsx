/**
 * DeadCodeCategoryHeader - Category header with toggle and checkbox
 */

import { useAtom } from 'jotai';
import React from 'react';
import { CategoryCheckbox } from '@/pages/dead-code/features/DeadCodeSelection/ui/CategoryCheckbox.tsx';
import { type CategoryKey, expandedCategoriesAtom } from '@/pages/dead-code/widgets/DeadCodePanel/model/categoryState';
import type { DeadCodeItem } from '@/pages/shared/features/DeadCode/lib/deadCodeAnalyzer.ts';
import { DeadCodeCategoryToggleButton } from './DeadCodeCategoryToggleButton.tsx';

export const DeadCodeCategoryHeader = React.forwardRef<
  HTMLDivElement,
  {
    title: string;
    items: DeadCodeItem[];
    categoryKey: CategoryKey;
    focused?: boolean;
    onFocus?: () => void;
  }
>((props, ref) => {
  const { title, items, categoryKey, focused, onFocus } = props;
  const [expandedCategories, setExpandedCategories] = useAtom(expandedCategoriesAtom);

  const isExpanded = expandedCategories[categoryKey];

  function toggleCategory() {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  }

  function handleFocus() {
    onFocus?.();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onFocus?.();
    }
  }

  return (
    <div
      ref={ref}
      className={`flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 transition-colors border-b border-border-DEFAULT ${
        focused ? 'bg-white/8' : ''
      }`}
      onClick={handleFocus}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <DeadCodeCategoryToggleButton
        title={title}
        itemCount={items.length}
        categoryKey={categoryKey}
        isExpanded={isExpanded}
        toggleCategory={toggleCategory}
      />

      <CategoryCheckbox items={items} />
    </div>
  );
});

DeadCodeCategoryHeader.displayName = 'DeadCodeCategoryHeader';
