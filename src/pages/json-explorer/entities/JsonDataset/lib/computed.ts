import Fuse, { type FuseResultMatch } from 'fuse.js';
import type { JsonDatasetSchemaInterface } from './schema';
import { extractJsonDatasetKeyPaths } from './schema';

export const JSON_DATASET_PARENT_KEY = '__parentKeyPath';

export interface JsonDatasetSearchResult {
  filteredRows: Record<string, unknown>[];
  searchMatches: Map<number, FuseResultMatch[]>;
  visibleColumns: string[];
}

export interface JsonDatasetLine {
  text: string;
  path: string | null;
  lineNumber: number;
}

export function getJsonDatasetColumns(
  rows: Record<string, unknown>[],
  options: { includeParentKey?: boolean } = {}
): string[] {
  if (rows.length === 0) return [];

  const keysOrder: string[] = [];
  const keysSet = new Set<string>();

  function addKey(key: string) {
    if (!options.includeParentKey && key === JSON_DATASET_PARENT_KEY) return;
    if (keysSet.has(key)) return;
    keysOrder.push(key);
    keysSet.add(key);
  }

  Object.keys(rows[0]).forEach(addKey);

  rows.forEach((row) => {
    Object.keys(row).forEach(addKey);
  });

  return keysOrder;
}

export function getJsonDatasetSchemaColumns(
  columns: string[],
  rows: Record<string, unknown>[],
  selectedSchema: string | null
): string[] {
  if (!selectedSchema) return columns;

  const schemaFields = extractJsonDatasetKeyPaths(rows, 3).filter((path) => {
    return path === selectedSchema || path.startsWith(`${selectedSchema}.`);
  });

  const schemaKeys = new Set(
    schemaFields.map((path) => {
      if (!path) return '';
      return path.split('.')[0];
    })
  );

  return columns.filter((column) => schemaKeys.has(column));
}

export function getJsonDatasetSearchResult(
  rows: Record<string, unknown>[],
  columns: string[],
  query: string
): JsonDatasetSearchResult {
  if (!query.trim()) {
    return {
      filteredRows: rows,
      searchMatches: new Map<number, FuseResultMatch[]>(),
      visibleColumns: columns,
    };
  }

  const fuse = new Fuse(rows, {
    keys: columns,
    threshold: 0.0,
    includeScore: true,
    includeMatches: true,
    ignoreLocation: true,
  });

  const results = fuse.search(query);
  const searchMatches = new Map<number, FuseResultMatch[]>();
  const matchedColumns = new Set<string>();

  const filteredRows = results.map((result, index) => {
    if (result.matches) {
      searchMatches.set(index, [...result.matches]);
      result.matches.forEach((match) => {
        if (match.key && match.key !== JSON_DATASET_PARENT_KEY) {
          matchedColumns.add(match.key);
        }
      });
    }
    return result.item;
  });

  const unmatchedColumns = columns.filter((column) => !matchedColumns.has(column));
  const shortColumns = unmatchedColumns
    .map((column) => {
      let totalLength = 0;
      let count = 0;

      filteredRows.forEach((row) => {
        const value = row[column];
        if (value !== null && value !== undefined) {
          totalLength += String(value).length;
          count++;
        }
      });

      return { column, avgLength: count > 0 ? totalLength / count : 0 };
    })
    .sort((a, b) => a.avgLength - b.avgLength)
    .slice(0, 3)
    .map((item) => item.column);

  return {
    filteredRows,
    searchMatches,
    visibleColumns: columns.filter((column) => matchedColumns.has(column) || shortColumns.includes(column)),
  };
}

export function getJsonDatasetColumnWidths(
  rows: Record<string, unknown>[],
  visibleColumns?: string[]
): Map<string, number> {
  const columns = visibleColumns ?? getJsonDatasetColumns(rows, { includeParentKey: true });
  const widths = new Map<string, number>();
  const sampleSize = Math.min(1000, rows.length);

  columns.forEach((column) => {
    let maxLength = column.length;

    for (let i = 0; i < sampleSize; i++) {
      const value = rows[i]?.[column];
      if (value !== null && value !== undefined) {
        maxLength = Math.max(maxLength, String(value).length);
      }
    }

    const pixelWidth = Math.max(80, Math.min(600, maxLength * 7 + 24));
    widths.set(column, pixelWidth);
  });

  return widths;
}

export function formatJsonDatasetHeader(key: string): string {
  const withSpaces = key.replace(/([A-Z])/g, ' $1');
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

export function getJsonDatasetSearchMatchCount(searchMatches?: Map<number, FuseResultMatch[]>): number {
  if (!searchMatches || searchMatches.size === 0) return 0;

  let count = 0;
  searchMatches.forEach((matches) => {
    matches.forEach((match) => {
      if (match.indices) {
        count += match.indices.length;
      }
    });
  });

  return count;
}

export function getJsonDatasetLines(json: string): JsonDatasetLine[] {
  const jsonLines = json.split('\n');
  const result: JsonDatasetLine[] = [];
  const pathStack: string[] = [];
  let inString = false;
  let currentKey = '';

  jsonLines.forEach((line, index) => {
    const trimmed = line.trim();

    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed[i] === '"' && (i === 0 || trimmed[i - 1] !== '\\')) {
        inString = !inString;
      }
    }

    const keyMatch = trimmed.match(/^"([^"]+)":/);
    if (keyMatch && !inString) {
      currentKey = keyMatch[1];
    }

    let currentPath: string | null = null;
    if (currentKey && pathStack.length > 0) {
      currentPath = [...pathStack, currentKey].join('.');
    } else if (currentKey) {
      currentPath = currentKey;
    }

    if ((trimmed.includes('{') || trimmed.includes('[')) && currentKey && !inString) {
      pathStack.push(currentKey);
      currentKey = '';
    }

    if ((trimmed === '}' || trimmed === '},' || trimmed === ']' || trimmed === '],') && !inString) {
      pathStack.pop();
    }

    result.push({
      text: line,
      path: currentPath,
      lineNumber: index + 1,
    });

    if (trimmed.endsWith(',') && !trimmed.endsWith('},') && !trimmed.endsWith('],')) {
      currentKey = '';
    }
  });

  return result;
}

export function stringifyJsonDatasetRow(row: Record<string, unknown> | null): string {
  if (!row) return '';
  return JSON.stringify(row, null, 2);
}

export function getJsonDatasetInterfaceCode(schemaInterface: JsonDatasetSchemaInterface): string {
  return `interface ${schemaInterface.interfaceName} {\n${schemaInterface.fields
    .map((field) => {
      const displayType = field.isArray ? `${field.type}[]` : field.type;
      const optional = field.isOptional ? '?' : '';
      return `  ${field.name}${optional}: ${displayType};`;
    })
    .join('\n')}\n}`;
}
