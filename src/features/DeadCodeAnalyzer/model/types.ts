/**
 * DeadCodeAnalyzer - Types
 */

export interface CategoryState {
  unusedExports: boolean;
  unusedImports: boolean;
  deadFunctions: boolean;
  unusedVariables: boolean;
}

export type CategoryKey = keyof CategoryState;
