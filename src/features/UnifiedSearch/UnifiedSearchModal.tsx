/**
 * Unified Search Modal - JetBrains-style search UI
 * Triggered by Shift+Shift
 */

import React, { useEffect, useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  searchModalOpenAtom,
  searchQueryAtom,
  searchResultsAtom,
  searchFocusedIndexAtom,
  searchModeAtom,
  filesAtom,
  fullNodeMapAtom,
  symbolMetadataAtom,
} from '../../store/atoms';
import { extractSearchableSymbols, extractSearchableFiles } from '../../services/symbolExtractor';
import { searchResults } from '../../services/searchService';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';

export const UnifiedSearchModal: React.FC = () => {
  const [isOpen, setIsOpen] = useAtom(searchModalOpenAtom);
  const [query, setQuery] = useAtom(searchQueryAtom);
  const [results, setResults] = useAtom(searchResultsAtom);
  const [focusedIndex, setFocusedIndex] = useAtom(searchFocusedIndexAtom);
  const [mode, setMode] = useAtom(searchModeAtom);

  const files = useAtomValue(filesAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const symbolMetadata = useAtomValue(symbolMetadataAtom);

  // Extract all searchable items (files + symbols)
  const allSearchableItems = useMemo(() => {
    const fileResults = extractSearchableFiles(files);
    const symbolResults = extractSearchableSymbols(fullNodeMap, symbolMetadata);
    return [...fileResults, ...symbolResults];
  }, [files, fullNodeMap, symbolMetadata]);

  // Perform search and update results
  useEffect(() => {
    if (!isOpen) return;

    const results = searchResults(query, allSearchableItems, mode);
    setResults(results);
    setFocusedIndex(0); // Reset focus to first result
  }, [query, allSearchableItems, mode, isOpen, setResults, setFocusedIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results.length, setFocusedIndex]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[15vh]"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl bg-[#0f172a] border border-vibe-border rounded shadow-2xl overflow-hidden">
        {/* Search Input */}
        <SearchInput />

        {/* Mode Selector */}
        <div className="flex gap-1 px-2.5 py-1.5 bg-black/20 border-b border-vibe-border/50">
          <button
            onClick={() => setMode('all')}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              mode === 'all'
                ? 'bg-vibe-accent/20 text-vibe-accent border border-vibe-accent/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setMode('files')}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              mode === 'files'
                ? 'bg-vibe-accent/20 text-vibe-accent border border-vibe-accent/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Files
          </button>
          <button
            onClick={() => setMode('symbols')}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              mode === 'symbols'
                ? 'bg-vibe-accent/20 text-vibe-accent border border-vibe-accent/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Symbols
          </button>
        </div>

        {/* Search Results */}
        <SearchResults onSelect={handleClose} />

        {/* Footer */}
        <div className="px-2.5 py-1.5 bg-black/20 border-t border-vibe-border/50 flex items-center justify-between text-[9px] text-slate-500 font-mono">
          <div className="flex gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div>Shift+Shift to open</div>
        </div>
      </div>
    </div>
  );
};
