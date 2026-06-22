/**
 * Unified Search Modal - LIMN Design System
 * Triggered by Shift+Shift
 */

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import type React from 'react';
import { useEffect, useMemo } from 'react';
import { filesAtom, focusedPaneAtom, fullNodeMapAtom } from '@/entities/AppView/model/atoms';
import { useOpenFile } from '@/features/File/OpenFiles/lib/useOpenFile.ts';
import {
  collapsedFoldersAtom,
  searchModalOpenAtom,
  searchQueryAtom,
  searchResultsAtom,
  symbolMetadataAtom,
} from '@/features/Search/UnifiedSearch/model/atoms.ts';
import { CommandPalette } from '@/shared/ui/CommandPalette';
import { searchResultsFuzzy } from '../lib/searchService.ts';
import { selectSearchResult } from '../lib/selectSearchResult.ts';
import { getAllSearchableItems } from '../lib/symbolExtractor.ts';
import type { SearchResult } from '../model/types.ts';

export const UnifiedSearchModal: React.FC = () => {
  const [isOpen, setIsOpen] = useAtom(searchModalOpenAtom);
  const [query, setQuery] = useAtom(searchQueryAtom);
  const results = useAtomValue(searchResultsAtom);
  const setResults = useSetAtom(searchResultsAtom);
  const [_collapsedFolders, setCollapsedFolders] = useAtom(collapsedFoldersAtom);
  const setFocusedPane = useSetAtom(focusedPaneAtom);

  const files = useAtomValue(filesAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const symbolMetadata = useAtomValue(symbolMetadataAtom);

  const { openFile } = useOpenFile();

  // Get all searchable items (files + folders + symbols + usages) from single source
  const allSearchableItems = useMemo(() => {
    return getAllSearchableItems(fullNodeMap, symbolMetadata, files);
  }, [fullNodeMap, symbolMetadata, files]);

  // Perform fuzzy search only
  useEffect(() => {
    if (!isOpen) return;

    // Empty query - show all results (limited)
    if (!query.trim()) {
      setResults(allSearchableItems.slice(0, 50));
      return;
    }

    // Fuzzy search only
    searchResultsFuzzy(query, allSearchableItems).then((fuzzyResults) => {
      console.log(`[Search] Query: "${query}", Results: ${fuzzyResults.length}`);
      if (fuzzyResults.length > 0 && fuzzyResults.length <= 20) {
        console.log(
          '[Search] Top results:',
          fuzzyResults.map((r) => `${r.name} (${r.type}) - ${r.filePath}`)
        );
      }
      setResults(fuzzyResults);
    });
  }, [query, allSearchableItems, isOpen, setResults]);

  function closeModal() {
    setIsOpen(false);
    // Keep query - don't clear it
    setResults([]);
  }

  function selectResult(result: SearchResult) {
    selectSearchResult(result, {
      openFile,
      changeCollapsedFolders: setCollapsedFolders,
      changeFocusedPane: setFocusedPane,
    });
    closeModal();
  }

  return (
    <CommandPalette
      open={isOpen}
      changeOpen={setIsOpen}
      query={query}
      changeQuery={setQuery}
      results={results}
      selectResult={selectResult}
    />
  );
};
