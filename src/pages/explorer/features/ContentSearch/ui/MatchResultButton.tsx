import type React from 'react';
import type { ContentMatch } from '../model/types';

interface MatchResultButtonProps {
  match: ContentMatch;
  itemIndex: number;
  isFocused: boolean;
  itemRefs: React.MutableRefObject<Map<number, HTMLElement>>;
  focusItem: (index: number) => void;
}

export function MatchResultButton({ match, itemIndex, isFocused, itemRefs, focusItem }: MatchResultButtonProps) {
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
