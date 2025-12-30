/**
 * Search Results List Component
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  searchResultsAtom,
  searchFocusedIndexAtom,
  entryFileAtom,
  visibleNodeIdsAtom,
  lastExpandedIdAtom,
} from '../../store/atoms';
import { SearchResultItem } from './SearchResultItem';
import { openFile, openSymbol } from '../File';

interface SearchResultsProps {
  onSelect: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ onSelect }) => {
  const results = useAtomValue(searchResultsAtom);
  const focusedIndex = useAtomValue(searchFocusedIndexAtom);
  const entryFile = useAtomValue(entryFileAtom);
  const setEntryFile = useSetAtom(entryFileAtom);
  const setVisibleNodeIds = useSetAtom(visibleNodeIdsAtom);
  const setLastExpandedId = useSetAtom(lastExpandedIdAtom);

  const containerRef = useRef<HTMLDivElement>(null);
  const focusedItemRef = useRef<HTMLDivElement>(null);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedItemRef.current && containerRef.current) {
      const container = containerRef.current;
      const item = focusedItemRef.current;

      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();

      if (itemRect.bottom > containerRect.bottom) {
        item.scrollIntoView({ block: 'end', behavior: 'smooth' });
      } else if (itemRect.top < containerRect.top) {
        item.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  }, [focusedIndex]);

  const handleSelectResult = useCallback((result: typeof results[0]) => {
    if (result.type === 'file') {
      // Open file
      openFile({
        filePath: result.filePath,
        currentEntryFile: entryFile,
        setEntryFile,
        setLastExpandedId,
      });
    } else if (result.type === 'symbol' && result.nodeId) {
      // Open symbol
      openSymbol({
        nodeId: result.nodeId,
        setVisibleNodeIds,
        setLastExpandedId,
      });
    }

    onSelect();
  }, [entryFile, setEntryFile, setVisibleNodeIds, setLastExpandedId, onSelect]);

  // Handle Enter key to select focused result
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        handleSelectResult(results[focusedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, results, handleSelectResult]);

  if (results.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-slate-500 text-[11px]">
        No results found
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="max-h-[400px] overflow-y-auto overflow-x-hidden"
    >
      {results.map((result, index) => (
        <SearchResultItem
          key={result.id}
          result={result}
          isFocused={index === focusedIndex}
          onClick={() => handleSelectResult(result)}
          ref={index === focusedIndex ? focusedItemRef : null}
        />
      ))}
    </div>
  );
};
