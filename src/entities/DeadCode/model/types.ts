export interface DeadCodeItem {
  filePath: string;
  symbolName: string;
  line: number;
  kind: 'export' | 'import' | 'function' | 'variable' | 'prop' | 'argument';
  category: 'unusedExport' | 'unusedImport' | 'deadFunction' | 'unusedVariable' | 'unusedProp' | 'unusedArgument';
  from?: string;
  componentName?: string;
  functionName?: string;
}

export interface DeadCodeResults {
  unusedExports: DeadCodeItem[];
  unusedImports: DeadCodeItem[];
  deadFunctions: DeadCodeItem[];
  unusedVariables: DeadCodeItem[];
  unusedProps: DeadCodeItem[];
  unusedArguments: DeadCodeItem[];
  totalCount: number;
}

export type DeadCodeCategoryKey =
  | 'unusedExports'
  | 'unusedImports'
  | 'deadFunctions'
  | 'unusedVariables'
  | 'unusedProps'
  | 'unusedArguments';

export interface DeadCodeCategoryInfo {
  title: string;
  items: DeadCodeItem[];
  key: DeadCodeCategoryKey;
}
