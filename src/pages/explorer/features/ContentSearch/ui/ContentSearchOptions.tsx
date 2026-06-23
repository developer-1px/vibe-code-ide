import type { ContentSearchOptions as ContentSearchOptionsValue } from '../model/types';
import { ContentSearchOptionCheckbox } from './ContentSearchOptionCheckbox';

interface ContentSearchOptionsProps {
  options: ContentSearchOptionsValue;
  changeOptions: (options: ContentSearchOptionsValue) => void;
}

export function ContentSearchOptions({ options, changeOptions }: ContentSearchOptionsProps) {
  function changeCaseSensitive(caseSensitive: boolean) {
    changeOptions({ ...options, caseSensitive });
  }

  function changeWholeWord(wholeWord: boolean) {
    changeOptions({ ...options, wholeWord });
  }

  function changeUseRegex(useRegex: boolean) {
    changeOptions({ ...options, useRegex });
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-border-DEFAULT bg-bg-elevated text-2xs flex-shrink-0">
      <ContentSearchOptionCheckbox
        label="Case Sensitive"
        checked={options.caseSensitive}
        changeChecked={changeCaseSensitive}
      />
      <ContentSearchOptionCheckbox label="Whole Word" checked={options.wholeWord} changeChecked={changeWholeWord} />
      <ContentSearchOptionCheckbox label="Use Regex" checked={options.useRegex} changeChecked={changeUseRegex} />
    </div>
  );
}
