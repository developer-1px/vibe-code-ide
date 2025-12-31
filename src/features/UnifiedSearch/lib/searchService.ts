/**
 * Search Service - Fuzzy search with Web Worker
 * Performs fuzzy matching in background thread for performance
 */

import type { SearchResult } from '../model/types';
import type { FuzzySearchRequest, FuzzySearchResponse } from './fuzzySearchWorker';

// Lazy-load Web Worker
let fuzzyWorker: Worker | null = null;

function getFuzzyWorker(): Worker {
  if (!fuzzyWorker) {
    fuzzyWorker = new Worker(
      new URL('./fuzzySearchWorker.ts', import.meta.url),
      { type: 'module' }
    );
  }
  return fuzzyWorker;
}

/**
 * Perform fuzzy search in Web Worker (background thread)
 * Returns a Promise that resolves with fuzzy search results
 *
 * Worker receives lightweight data (id, name, type) and returns IDs + matches
 * Main thread merges with original data to preserve all fields (codeSnippet, etc.)
 */
export function searchResultsFuzzy(
  query: string,
  allResults: SearchResult[],
): Promise<SearchResult[]> {
  return new Promise((resolve) => {
    // Empty query returns empty results immediately
    if (!query.trim()) {
      resolve([]);
      return;
    }

    // Create lookup map for fast access to original data
    const resultMap = new Map(allResults.map(item => [item.id, item]));

    // Send only lightweight data to worker (id, name, type, filePath)
    const lightweightItems = allResults.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      filePath: item.filePath
    }));

    const worker = getFuzzyWorker();

    // Listen for results from worker
    const handleMessage = (event: MessageEvent<FuzzySearchResponse>) => {
      if (event.data.type === 'results') {
        worker.removeEventListener('message', handleMessage);

        // Merge worker results (id + matches) with original data
        const results: SearchResult[] = event.data.results
          .map(workerResult => {
            const originalData = resultMap.get(workerResult.id);
            if (!originalData) return null;

            return {
              ...originalData,  // Full original data (includes codeSnippet!)
              score: 50,
              matchType: 'fuzzy' as const,
              matches: workerResult.matches,
            } as SearchResult;
          })
          .filter((item): item is SearchResult => item !== null);

        // Boost priority: files matching query without extension
        const queryLower = query.toLowerCase();
        results.sort((a, b) => {
          // Check if file name (without extension) matches query exactly
          const isFileA = a.type === 'file';
          const isFileB = b.type === 'file';

          if (isFileA) {
            const nameWithoutExt = a.name.replace(/\.[^/.]+$/, '').toLowerCase();
            const exactMatchA = nameWithoutExt === queryLower ? 1 : 0;

            if (isFileB) {
              const nameWithoutExtB = b.name.replace(/\.[^/.]+$/, '').toLowerCase();
              const exactMatchB = nameWithoutExtB === queryLower ? 1 : 0;

              // Both files: exact match first
              if (exactMatchA !== exactMatchB) return exactMatchB - exactMatchA;
            } else {
              // A is file, B is not: exact match file wins
              if (exactMatchA) return -1;
            }
          } else if (isFileB) {
            const nameWithoutExtB = b.name.replace(/\.[^/.]+$/, '').toLowerCase();
            const exactMatchB = nameWithoutExtB === queryLower ? 1 : 0;
            // B is file, A is not: exact match file wins
            if (exactMatchB) return 1;
          }

          // Keep Fuse.js order
          return 0;
        });

        resolve(results);
      }
    };

    worker.addEventListener('message', handleMessage);

    // Send search request to worker
    const request: FuzzySearchRequest = {
      type: 'search',
      query,
      items: lightweightItems,
    };

    worker.postMessage(request);
  });
}

/**
 * Cleanup worker on page unload
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (fuzzyWorker) {
      fuzzyWorker.terminate();
      fuzzyWorker = null;
    }
  });
}
