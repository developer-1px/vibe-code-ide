import type React from 'react';
import type { ContentSearchResult } from '../model/types';
import { FileResultButton } from './FileResultButton';
import { MatchResultButton } from './MatchResultButton';

interface ContentSearchResultsProps {
  query: string;
  results: ContentSearchResult[];
  focusedIndex: number;
  itemRefs: React.MutableRefObject<Map<number, HTMLElement>>;
  scrollContainerRef: React.Ref<HTMLDivElement>;
  focusItem: (index: number) => void;
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
    <div
      ref={scrollContainerRef}
      className="w-[400px] min-h-0 flex-shrink-0 overflow-y-auto border-r border-border-DEFAULT"
    >
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
