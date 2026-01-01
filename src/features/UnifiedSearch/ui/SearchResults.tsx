/**
 * Search Results List Component
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  searchResultsAtom,
  searchFocusedIndexAtom,
  collapsedFoldersAtom,
  focusedPaneAtom,
} from '../../../store/atoms';
import { useOpenFile } from '../../Files/lib/useOpenFile';
import { SearchResultItem } from './SearchResultItem';

interface SearchResultsProps {
  onSelect: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ onSelect }) => {
  const results = useAtomValue(searchResultsAtom);
  const focusedIndex = useAtomValue(searchFocusedIndexAtom);
  const [collapsedFolders, setCollapsedFolders] = useAtom(collapsedFoldersAtom);
  const setFocusedPane = useSetAtom(focusedPaneAtom);
  const { openFile } = useOpenFile();

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
        item.scrollIntoView({ block: 'end', behavior: 'auto' });
      } else if (itemRect.top < containerRect.top) {
        item.scrollIntoView({ block: 'start', behavior: 'auto' });
      }
    }
  }, [focusedIndex]);

  const handleSelectResult = useCallback((result: typeof results[0]) => {
    if (result.type === 'file') {
      // Open file
      openFile(result.filePath);
    } else if (result.type === 'folder') {
      // Open folder in FolderView (expand recursively)
      const folderPath = result.filePath;

      // Get all parent folders (recursively)
      const parts = folderPath.split('/');
      const foldersToOpen: string[] = [];
      for (let i = 1; i <= parts.length; i++) {
        const parentFolder = parts.slice(0, i).join('/');
        if (parentFolder) {
          foldersToOpen.push(parentFolder);
        }
      }

      // Remove all parent folders from collapsed set
      setCollapsedFolders(prev => {
        const next = new Set(prev);
        foldersToOpen.forEach(folder => next.delete(folder));
        return next;
      });

      // Focus sidebar
      setFocusedPane('sidebar');
    } else if (result.type === 'symbol') {
      console.log('[SearchResults] CodeSymbol selected:', {
        name: result.name,
        nodeId: result.nodeId,
        filePath: result.filePath,
        lineNumber: result.lineNumber,
        nodeType: result.nodeType,
      });

      // For Usage: just open file and scroll to line
      if (result.nodeType === 'usage') {
        openFile(result.filePath, {
          lineNumber: result.lineNumber
        });
        return;
      }

      // For Declaration: open file, scroll to symbol, and activate focus mode
      openFile(result.filePath, {
        lineNumber: result.lineNumber || 0,
        focusSymbol: result.name,
        focusPane: 'canvas'
      });

      console.log('[SearchResults] Activated focus mode for:', result.name, 'in file:', result.filePath);
    }

    onSelect();
  }, [openFile, setCollapsedFolders, setFocusedPane, onSelect]);

  // Custom hook for search-scoped hotkeys
  // useHotkeys로 시작하는 네이밍으로 IDE 자동완성에서 쉽게 찾을 수 있음
  const useHotkeysSearch = (
    keys: string,
    callback: (e: KeyboardEvent) => void,
    deps: any[]
  ) => {
    useHotkeys(keys, callback, {
      scopes: ['search'],
      enabled: results.length > 0,
      enableOnFormTags: true
    }, deps);
  };

  // Handle Enter key to select focused result - scoped to 'search'
  useHotkeysSearch('enter', (e) => {
    if (results.length > 0) {
      e.preventDefault();
      handleSelectResult(results[focusedIndex]);
    }
  }, [results.length, focusedIndex, handleSelectResult]);

  if (results.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-theme-text-secondary text-[11px]">
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
