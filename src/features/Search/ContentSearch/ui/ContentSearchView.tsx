/**
 * ContentSearchView - File content search view (Cmd+Shift+F)
 * Grep-style search across all files (mainContent tab, not modal)
 */

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef } from 'react';
import { filesAtom, viewModeAtom } from '@/entities/AppView/model/atoms';
import { useOpenFile } from '@/features/File/OpenFiles/lib/useOpenFile';
import { useListKeyboardNavigation } from '@/shared/hooks/useListKeyboardNavigation';
import { getFileName } from '@/shared/pathUtils';
import { searchInContent } from '../lib/searchContent';
import {
  contentSearchLoadingAtom,
  contentSearchOptionsAtom,
  contentSearchQueryAtom,
  contentSearchResultsAtom,
} from '../model/atoms';
import { ContentSearchInput } from './ContentSearchInput';
import { ContentSearchOptions } from './ContentSearchOptions';
import { ContentSearchPreview, type ContentSearchPreviewInfo } from './ContentSearchPreview';
import { ContentSearchResults } from './ContentSearchResults';

type ContentSearchFlatItem = { type: 'file' | 'match'; fileIndex: number; matchIndex?: number };

export function ContentSearchView() {
  const viewMode = useAtomValue(viewModeAtom);
  const setViewMode = useSetAtom(viewModeAtom);
  const [query, setQuery] = useAtom(contentSearchQueryAtom);
  const [options, setOptions] = useAtom(contentSearchOptionsAtom);
  const setResults = useSetAtom(contentSearchResultsAtom);
  const setLoading = useSetAtom(contentSearchLoadingAtom);
  const results = useAtomValue(contentSearchResultsAtom);
  const files = useAtomValue(filesAtom);
  const { openFile } = useOpenFile();

  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = viewMode === 'contentSearch';

  // Focus input when view opens
  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    }
  }, [isActive]);

  // Debounced search
  useEffect(() => {
    if (!isActive) return;

    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        setLoading(true);
        const searchResults = searchInContent(files, query, options);
        setResults(searchResults);
        setLoading(false);
        // Note: focusedIndex is automatically reset to 0 by useListKeyboardNavigation when items change
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, options, files, isActive, setResults, setLoading]);

  // Flatten results for navigation
  const flatResults = useMemo(() => {
    const flat: ContentSearchFlatItem[] = [];
    results.forEach((result, fileIndex) => {
      flat.push({ type: 'file', fileIndex });
      result.matches.forEach((_, matchIndex) => {
        flat.push({ type: 'match', fileIndex, matchIndex });
      });
    });
    return flat;
  }, [results]);

  function handleResultSelect(item: ContentSearchFlatItem) {
    const result = results[item.fileIndex];
    openFile(result.filePath);
    setViewMode('ide');
    // TODO: Scroll to line number if match item
  }

  function handleCloseSearch() {
    setViewMode('ide');
    setQuery('');
    setResults([]);
  }

  // Keyboard navigation with auto-scroll
  const { focusedIndex, setFocusedIndex, itemRefs, scrollContainerRef } = useListKeyboardNavigation({
    items: flatResults,
    onSelect: handleResultSelect,
    onClose: handleCloseSearch,
    scope: 'contentSearch',
    enabled: isActive,
    enableOnFormTags: true,
  });

  // Get current preview info
  const previewInfo = useMemo<ContentSearchPreviewInfo | null>(() => {
    if (flatResults.length === 0 || focusedIndex >= flatResults.length) return null;

    const focused = flatResults[focusedIndex];
    const result = results[focused.fileIndex];
    const fileContent = files[result.filePath] || '';
    const matchLine = focused.matchIndex !== undefined ? result.matches[focused.matchIndex].line : undefined;

    return {
      filePath: result.filePath,
      fileName: getFileName(result.filePath),
      content: fileContent,
      matchLine,
    };
  }, [flatResults, focusedIndex, results, files]);

  // Auto-scroll to matched line in preview
  const previewRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (!previewRef.current || !previewInfo?.matchLine) return;

    // Find line element and scroll into view
    const lineElements = previewRef.current.querySelectorAll('[data-line]');
    const targetLine = Array.from(lineElements).find(
      (el) => el.getAttribute('data-line') === String(previewInfo.matchLine)
    );

    if (targetLine) {
      targetLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [previewInfo?.matchLine]);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-bg-deep">
      <ContentSearchInput query={query} inputRef={inputRef} changeQuery={setQuery} />
      <ContentSearchOptions options={options} changeOptions={setOptions} />

      {/* Main content: Results (left) + Preview (right) */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <ContentSearchResults
          query={query}
          results={results}
          focusedIndex={focusedIndex}
          itemRefs={itemRefs}
          scrollContainerRef={scrollContainerRef}
          focusItem={setFocusedIndex}
        />
        <ContentSearchPreview previewInfo={previewInfo} previewRef={previewRef} />
      </div>
    </div>
  );
}
