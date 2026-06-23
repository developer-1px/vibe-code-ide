import type React from 'react';

interface FileResultButtonProps {
  filePath: string;
  totalMatches: number;
  itemIndex: number;
  isFocused: boolean;
  itemRefs: React.MutableRefObject<Map<number, HTMLElement>>;
  focusItem: (index: number) => void;
}

export function FileResultButton({
  filePath,
  totalMatches,
  itemIndex,
  isFocused,
  itemRefs,
  focusItem,
}: FileResultButtonProps) {
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
