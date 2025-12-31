/**
 * UnifiedSearch Feature - Public API
 */

export { UnifiedSearchModal } from './ui/UnifiedSearchModal';
export type { SearchResult, SymbolMetadata } from './model/types';
export { searchResultsFuzzy } from './lib/searchService';
export { extractAllSearchableItems } from './lib/symbolExtractor';
