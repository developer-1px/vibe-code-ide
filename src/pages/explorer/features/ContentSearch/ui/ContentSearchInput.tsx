import { Search } from 'lucide-react';
import type React from 'react';

interface ContentSearchInputProps {
  query: string;
  inputRef: React.Ref<HTMLInputElement>;
  changeQuery: (query: string) => void;
}

export function ContentSearchInput({ query, inputRef, changeQuery }: ContentSearchInputProps) {
  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    changeQuery(e.target.value);
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border-DEFAULT bg-bg-elevated flex-shrink-0">
      <Search size={16} className="text-text-tertiary" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleQueryChange}
        placeholder="Search in files... (Cmd+Shift+F)"
        className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-tertiary outline-none"
      />
    </div>
  );
}
