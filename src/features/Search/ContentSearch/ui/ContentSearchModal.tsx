/**
 * ContentSearchModal - File content search modal (Cmd+Shift+F)
 * Grep-style search across all files
 */

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys, useHotkeysContext } from 'react-hotkeys-hook';
import { filesAtom } from '../../../../entities/AppView/model/atoms';
import { useOpenFile } from '../../../File/OpenFiles/lib/useOpenFile';
import { searchInContent } from '../lib/searchContent';
import {
  contentSearchLoadingAtom,
  contentSearchModalOpenAtom,
  contentSearchOptionsAtom,
  contentSearchQueryAtom,
  contentSearchResultsAtom,
} from '../model/atoms';

export function ContentSearchModal() {
  const [isOpen, setIsOpen] = useAtom(contentSearchModalOpenAtom);
  const [query, setQuery] = useAtom(contentSearchQueryAtom);
  const [options, setOptions] = useAtom(contentSearchOptionsAtom);
  const setResults = useSetAtom(contentSearchResultsAtom);
  const setLoading = useSetAtom(contentSearchLoadingAtom);
  const results = useAtomValue(contentSearchResultsAtom);
  const files = useAtomValue(filesAtom);
  const { openFile } = useOpenFile();

  const inputRef = useRef<HTMLInputElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Get scope control
  const { enableScope, disableScope } = useHotkeysContext();

  // Enable/disable scope
  useEffect(() => {
    if (isOpen) {
      enableScope('contentSearch');
    } else {
      disableScope('contentSearch');
    }
  }, [isOpen, enableScope, disableScope]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        setLoading(true);
        const searchResults = searchInContent(files, query, options);
        setResults(searchResults);
        setLoading(false);
        setFocusedIndex(0);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, options, files, isOpen, setResults, setLoading]);

  // Flatten results for navigation
  const flatResults = useMemo(() => {
    const flat: Array<{ type: 'file' | 'match'; fileIndex: number; matchIndex?: number }> = [];
    results.forEach((result, fileIndex) => {
      flat.push({ type: 'file', fileIndex });
      result.matches.forEach((_, matchIndex) => {
        flat.push({ type: 'match', fileIndex, matchIndex });
      });
    });
    return flat;
  }, [results]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setFocusedIndex(0);
  };

  const handleSelect = () => {
    const focused = flatResults[focusedIndex];
    if (!focused) return;

    const result = results[focused.fileIndex];
    if (focused.type === 'file') {
      openFile(result.filePath);
      handleClose();
    } else if (focused.type === 'match' && focused.matchIndex !== undefined) {
      openFile(result.filePath);
      handleClose();
      // TODO: Scroll to line number
    }
  };

  // Keyboard shortcuts (scoped to 'contentSearch')
  useHotkeys(
    'escape',
    (e) => {
      e.preventDefault();
      handleClose();
    },
    {
      scopes: ['contentSearch'],
      enabled: isOpen,
      enableOnFormTags: true,
    },
    [isOpen]
  );

  useHotkeys(
    'down',
    (e) => {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    },
    {
      scopes: ['contentSearch'],
      enabled: isOpen,
      enableOnFormTags: true,
    },
    [isOpen, flatResults.length]
  );

  useHotkeys(
    'up',
    (e) => {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    },
    {
      scopes: ['contentSearch'],
      enabled: isOpen,
      enableOnFormTags: true,
    },
    [isOpen]
  );

  useHotkeys(
    'enter',
    (e) => {
      e.preventDefault();
      handleSelect();
    },
    {
      scopes: ['contentSearch'],
      enabled: isOpen,
      enableOnFormTags: true,
    },
    [isOpen, focusedIndex, flatResults, results]
  );

  if (!isOpen) return null;

  let currentFlatIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50">
      <div className="w-[600px] max-h-[500px] bg-bg-elevated border border-border-DEFAULT rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border-DEFAULT">
          <Search size={16} className="text-text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in files... (Cmd+Shift+F)"
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-tertiary outline-none"
          />
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-bg-deep transition-colors text-text-tertiary hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Options */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border-DEFAULT text-2xs">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={options.caseSensitive}
              onChange={(e) => setOptions({ ...options, caseSensitive: e.target.checked })}
              className="rounded"
            />
            <span className="text-text-secondary">Case Sensitive</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={options.wholeWord}
              onChange={(e) => setOptions({ ...options, wholeWord: e.target.checked })}
              className="rounded"
            />
            <span className="text-text-secondary">Whole Word</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={options.useRegex}
              onChange={(e) => setOptions({ ...options, useRegex: e.target.checked })}
              className="rounded"
            />
            <span className="text-text-secondary">Use Regex</span>
          </label>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {results.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-text-tertiary text-xs">
              {query ? 'No results found' : 'Type to search...'}
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, _fileIndex) => {
                const fileItemIndex = currentFlatIndex++;
                const isFileFocused = focusedIndex === fileItemIndex;

                return (
                  <div key={result.filePath} className="mb-3">
                    {/* File header */}
                    <button
                      onClick={() => {
                        openFile(result.filePath);
                        handleClose();
                      }}
                      className={`w-full flex items-center justify-between px-4 py-1.5 text-left hover:bg-bg-deep transition-colors ${
                        isFileFocused ? 'bg-bg-deep' : ''
                      }`}
                    >
                      <span className="text-xs font-medium text-text-primary">{result.filePath}</span>
                      <span className="text-2xs text-text-tertiary">
                        {result.totalMatches} {result.totalMatches === 1 ? 'match' : 'matches'}
                      </span>
                    </button>

                    {/* Matches */}
                    <div className="space-y-0.5 ml-4">
                      {result.matches.map((match, matchIndex) => {
                        const matchItemIndex = currentFlatIndex++;
                        const isMatchFocused = focusedIndex === matchItemIndex;

                        return (
                          <button
                            key={matchIndex}
                            onClick={() => {
                              openFile(result.filePath);
                              handleClose();
                            }}
                            className={`w-full px-4 py-1 text-left hover:bg-bg-deep transition-colors ${
                              isMatchFocused ? 'bg-bg-deep' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 text-2xs">
                              <span className="text-text-tertiary font-mono">{match.line}</span>
                              <span className="text-text-secondary truncate font-mono">
                                {match.text.slice(0, match.matchStart)}
                                <span className="bg-warm-300/20 text-warm-300">
                                  {match.text.slice(match.matchStart, match.matchEnd)}
                                </span>
                                {match.text.slice(match.matchEnd)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
