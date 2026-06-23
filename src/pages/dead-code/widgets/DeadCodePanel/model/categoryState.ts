import { atom } from 'jotai';

export interface CategoryState {
  unusedExports: boolean;
  unusedImports: boolean;
  deadFunctions: boolean;
  unusedVariables: boolean;
  unusedProps: boolean;
  unusedArguments: boolean;
}

export type CategoryKey = keyof CategoryState;

export const expandedCategoriesAtom = atom<CategoryState>({
  unusedExports: false,
  unusedImports: false,
  deadFunctions: false,
  unusedVariables: false,
  unusedProps: false,
  unusedArguments: false,
});
