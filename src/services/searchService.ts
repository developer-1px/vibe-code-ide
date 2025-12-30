/**
 * Search Service - Fuzzy search with scoring for files and symbols
 */

import type { SearchResult } from '../store/atoms';

/**
 * Calculate search score for a candidate string against a query
 * Higher score = better match
 */
function calculateScore(query: string, candidate: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerCandidate = candidate.toLowerCase();

  // Exact match (case-insensitive)
  if (lowerCandidate === lowerQuery) {
    return 100;
  }

  // Start match (case-insensitive)
  if (lowerCandidate.startsWith(lowerQuery)) {
    return 80;
  }

  // Camel case match (e.g., "uls" matches "useLocalStorage")
  if (matchesCamelCase(query, candidate)) {
    return 60;
  }

  // Substring match (case-insensitive)
  if (lowerCandidate.includes(lowerQuery)) {
    return 40;
  }

  // No match
  return 0;
}

/**
 * Check if query matches camel case acronym of candidate
 * e.g., "uls" matches "useLocalStorage"
 */
function matchesCamelCase(query: string, candidate: string): boolean {
  const lowerQuery = query.toLowerCase();

  // Extract camel case capitals (and first letter)
  const acronym = candidate
    .split('')
    .filter((char, idx) => {
      // Include first character
      if (idx === 0) return true;
      // Include uppercase letters
      if (char === char.toUpperCase() && char !== char.toLowerCase()) return true;
      return false;
    })
    .join('')
    .toLowerCase();

  return acronym.startsWith(lowerQuery);
}

/**
 * Search through results and return scored, filtered, and sorted matches
 */
export function searchResults(
  query: string,
  allResults: SearchResult[],
  mode: 'all' | 'files' | 'symbols' = 'all',
  maxResults: number = 50
): SearchResult[] {
  // Empty query returns all results (limited)
  if (!query.trim()) {
    const filtered = filterByMode(allResults, mode);
    return filtered.slice(0, maxResults);
  }

  // Score all results
  const scored = allResults.map((result) => {
    // Score against name
    const nameScore = calculateScore(query, result.name);

    // Score against file path (for files)
    const pathScore = result.type === 'file'
      ? calculateScore(query, result.filePath)
      : 0;

    // Use the higher score
    const finalScore = Math.max(nameScore, pathScore);

    return {
      ...result,
      score: finalScore,
    };
  });

  // Filter by mode and score > 0
  const filtered = scored.filter((result) => {
    if (result.score === 0) return false;
    if (mode === 'files' && result.type !== 'file') return false;
    if (mode === 'symbols' && result.type !== 'symbol') return false;
    return true;
  });

  // Sort by score (descending)
  filtered.sort((a, b) => {
    // Primary sort: score
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Secondary sort: name (alphabetical)
    return a.name.localeCompare(b.name);
  });

  // Limit results
  return filtered.slice(0, maxResults);
}

/**
 * Filter results by search mode
 */
function filterByMode(
  results: SearchResult[],
  mode: 'all' | 'files' | 'symbols'
): SearchResult[] {
  if (mode === 'all') return results;
  return results.filter((result) => {
    if (mode === 'files') return result.type === 'file';
    if (mode === 'symbols') return result.type === 'symbol';
    return true;
  });
}
