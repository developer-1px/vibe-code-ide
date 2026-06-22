import type React from 'react';
import type { ContentMatch, ContentSearchResult } from '../model/types';

interface ContentSearchResultsProps {
  query: string;
  results: ContentSearchResult[];
  focusedIndex: number;
  itemRefs: React.MutableRefObject<Map<number, HTMLElement>>;
  scrollContainerRef: React.Ref<HTMLDivElement>;
  focusItem: (index: number) => void;
}

function FileResultButton({
  filePath,
  totalMatches,
  itemIndex,
  isFocused,
  itemRefs,
  focusItem,
}: {
  filePath: string;
  totalMatches: number;
  itemIndex: number;
  isFocused: boolean;
  itemRefs: React.MutableRefObject<Map<number, HTMLElement>>;
  focusItem: (index: number) => void;
}) {
  function handleItemRef(el: HTMLButtonElement | null) {
    if (el) itemRefs.current.set(itemIndex, el);
    else itemRefs.current.delete(itemIndex);
  }

  function handleClick() {
    focusItem(itemIndex);
  }

  return (
    <button
      type="button"
      ref={handleItemRef}
      onClick={handleClick}
      className={`w-full flex items-center justify-between px-4 py-1.5 text-left hover:bg-bg-elevated transition-colors ${
        isFocused ? 'bg-bg-elevated' : ''
      }`}
    >
      <span className="text-xs font-medium text-text-primary">{filePath}</span>
      <span className="text-2xs text-text-tertiary">
        {totalMatches} {totalMatches === 1 ? 'match' : 'matches'}
      </span>
    </button>
  );
}

function MatchResultButton({
  match,
  itemIndex,
  isFocused,
  itemRefs,
  focusItem,
}: {
  match: ContentMatch;
  itemIndex: number;
  isFocused: boolean;
  itemRefs: React.MutableRefObject<Map<number, HTMLElement>>;
  focusItem: (index: number) => void;
}) {
  function handleItemRef(el: HTMLButtonElement | null) {
    if (el) itemRefs.current.set(itemIndex, el);
    else itemRefs.current.delete(itemIndex);
  }

  function handleClick() {
    focusItem(itemIndex);
  }

  return (
    <button
      type="button"
      ref={handleItemRef}
      onClick={handleClick}
      className={`w-full px-4 py-1 text-left hover:bg-bg-elevated transition-colors ${
        isFocused ? 'bg-bg-elevated' : ''
      }`}
    >
      <div className="flex items-center gap-2 text-2xs">
        <span className="text-text-tertiary font-mono">{match.line}</span>
        <span className="text-text-secondary truncate font-mono">
          {match.text.slice(0, match.matchStart)}
          <span className="bg-warm-300/20 text-warm-300">{match.text.slice(match.matchStart, match.matchEnd)}</span>
          {match.text.slice(match.matchEnd)}
        </span>
      </div>
    </button>
  );
}

export function ContentSearchResults({
  query,
  results,
  focusedIndex,
  itemRefs,
  scrollContainerRef,
  focusItem,
}: ContentSearchResultsProps) {
  let currentFlatIndex = 0;

  return (
    <div ref={scrollContainerRef} className="w-[400px] flex-shrink-0 overflow-y-auto border-r border-border-DEFAULT">
      {results.length === 0 ? (
        <div className="flex items-center justify-center h-full text-text-tertiary text-xs">
          {query ? 'No results found' : 'Type to search...'}
        </div>
      ) : (
        <div className="py-2">
          {results.map((result, _fileIndex) => {
            const fileItemIndex = currentFlatIndex++;
            const isFileFocused = focusedIndex === fileItemIndex;

            return (
              <div key={result.filePath} className="mb-3">
                <FileResultButton
                  filePath={result.filePath}
                  totalMatches={result.totalMatches}
                  itemIndex={fileItemIndex}
                  isFocused={isFileFocused}
                  itemRefs={itemRefs}
                  focusItem={focusItem}
                />

                <div className="space-y-0.5 ml-4">
                  {result.matches.map((match, matchIndex) => {
                    const matchItemIndex = currentFlatIndex++;
                    const isMatchFocused = focusedIndex === matchItemIndex;

                    return (
                      <MatchResultButton
                        key={matchIndex}
                        match={match}
                        itemIndex={matchItemIndex}
                        isFocused={isMatchFocused}
                        itemRefs={itemRefs}
                        focusItem={focusItem}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
