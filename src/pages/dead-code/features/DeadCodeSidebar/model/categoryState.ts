import { atom } from 'jotai';
import type { DeadCodeCategoryKey } from '@/entities/DeadCode/model/types';

export type CategoryKey = DeadCodeCategoryKey;

export type CategoryState = Record<CategoryKey, boolean>;

export const expandedCategoriesAtom = atom<CategoryState>({
  unusedExports: false,
  unusedImports: false,
  deadFunctions: false,
  unusedVariables: false,
  unusedProps: false,
  unusedArguments: false,
});
