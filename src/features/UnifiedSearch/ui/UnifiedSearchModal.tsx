/**
 * Unified Search Modal - JetBrains-style search UI
 * Triggered by Shift+Shift
 */

import React, { useEffect, useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useHotkeys, useHotkeysContext } from 'react-hotkeys-hook';
import {
  searchModalOpenAtom,
  searchQueryAtom,
  searchResultsAtom,
  searchFocusedIndexAtom,
  searchModeAtom,
  filesAtom,
  fullNodeMapAtom,
  symbolMetadataAtom,
} from '../../../store/atoms';
import { extractAllSearchableItems } from '../lib/symbolExtractor';
import { searchResultsFuzzy } from '../lib/searchService';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';

export const UnifiedSearchModal: React.FC = () => {
  const [isOpen, setIsOpen] = useAtom(searchModalOpenAtom);
  const [query, setQuery] = useAtom(searchQueryAtom);
  const [results, setResults] = useAtom(searchResultsAtom);
  const [focusedIndex, setFocusedIndex] = useAtom(searchFocusedIndexAtom);

  const files = useAtomValue(filesAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const symbolMetadata = useAtomValue(symbolMetadataAtom);

  // Hotkeys scope management
  const { enableScope, disableScope } = useHotkeysContext();

  // Activate 'search' scope when modal opens, deactivate when closes
  useEffect(() => {
    if (isOpen) {
      enableScope('search');
      console.log('[UnifiedSearchModal] Enabled search scope');
    } else {
      disableScope('search');
      console.log('[UnifiedSearchModal] Disabled search scope');
    }
  }, [isOpen, enableScope, disableScope]);

  // Extract all searchable items (files + folders + symbols + usages) from single source
  const allSearchableItems = useMemo(() => {
    return extractAllSearchableItems(fullNodeMap, symbolMetadata, files);
  }, [fullNodeMap, symbolMetadata, files]);

  // Perform fuzzy search only
  useEffect(() => {
    if (!isOpen) return;

    // Empty query - show all results (limited)
    if (!query.trim()) {
      setResults(allSearchableItems.slice(0, 50));
      setFocusedIndex(0);
      return;
    }

    // Fuzzy search only
    searchResultsFuzzy(query, allSearchableItems).then(fuzzyResults => {
      console.log(`[Search] Query: "${query}", Results: ${fuzzyResults.length}`);
      if (fuzzyResults.length > 0 && fuzzyResults.length <= 20) {
        console.log('[Search] Top results:', fuzzyResults.map(r => `${r.name} (${r.type}) - ${r.filePath}`));
      }
      setResults(fuzzyResults);
      setFocusedIndex(0);
    });
  }, [query, allSearchableItems, isOpen, setResults, setFocusedIndex]);

  // Custom hook for search-scoped hotkeys
  // useHotkeys로 시작하는 네이밍으로 IDE 자동완성에서 쉽게 찾을 수 있음
  const useHotkeysSearch = (
    keys: string,
    callback: (e: KeyboardEvent) => void,
    deps: any[]
  ) => {
    useHotkeys(keys, callback, {
      scopes: ['search'],
      enabled: isOpen,
      enableOnFormTags: true
    }, deps);
  };

  // Keyboard shortcuts - scoped to 'search'
  useHotkeysSearch('escape', (e) => {
    e.preventDefault();
    handleClose();
  }, [isOpen]);

  useHotkeysSearch('down', (e) => {
    e.preventDefault();
    setFocusedIndex((prev) => Math.min(prev + 1, results.length - 1));
  }, [isOpen, results.length, setFocusedIndex]);

  useHotkeysSearch('up', (e) => {
    e.preventDefault();
    setFocusedIndex((prev) => Math.max(prev - 1, 0));
  }, [isOpen, setFocusedIndex]);

  const handleClose = () => {
    setIsOpen(false);
    // Keep query - don't clear it
    setResults([]);
    setFocusedIndex(0);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl bg-theme-background border border-theme-border rounded shadow-2xl overflow-hidden">
        {/* Search Input */}
        <SearchInput />

        {/* Search Results */}
        <SearchResults onSelect={handleClose} />

        {/* Footer */}
        <div className="px-2.5 py-1.5 bg-theme-background/20 border-t border-theme-border/50 flex items-center justify-between text-[9px] text-theme-text-tertiary font-mono">
          <div className="flex gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
            <span className="text-theme-border">|</span>
            <span className="text-theme-text-accent/70">symbol/file or symbol file</span>
          </div>
          <div>Shift+Shift to open</div>
        </div>
      </div>
    </div>
  );
};
