import type React from 'react';
import type { ContentSearchOptions as ContentSearchOptionsValue } from '../model/types';

interface ContentSearchOptionsProps {
  options: ContentSearchOptionsValue;
  changeOptions: (options: ContentSearchOptionsValue) => void;
}

export function ContentSearchOptions({ options, changeOptions }: ContentSearchOptionsProps) {
  function handleCaseSensitiveChange(e: React.ChangeEvent<HTMLInputElement>) {
    changeOptions({ ...options, caseSensitive: e.target.checked });
  }

  function handleWholeWordChange(e: React.ChangeEvent<HTMLInputElement>) {
    changeOptions({ ...options, wholeWord: e.target.checked });
  }

  function handleUseRegexChange(e: React.ChangeEvent<HTMLInputElement>) {
    changeOptions({ ...options, useRegex: e.target.checked });
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-border-DEFAULT bg-bg-elevated text-2xs flex-shrink-0">
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={options.caseSensitive}
          onChange={handleCaseSensitiveChange}
          className="rounded"
        />
        <span className="text-text-secondary">Case Sensitive</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input type="checkbox" checked={options.wholeWord} onChange={handleWholeWordChange} className="rounded" />
        <span className="text-text-secondary">Whole Word</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input type="checkbox" checked={options.useRegex} onChange={handleUseRegexChange} className="rounded" />
        <span className="text-text-secondary">Use Regex</span>
      </label>
    </div>
  );
}
