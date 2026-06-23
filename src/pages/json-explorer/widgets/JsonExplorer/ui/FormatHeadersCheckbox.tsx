import { Checkbox } from '@/shared/ui/Checkbox';

interface FormatHeadersCheckboxProps {
  formatHeaders: boolean;
  changeFormatHeaders: (nextFormatHeaders: boolean) => void;
}

export function FormatHeadersCheckbox({ formatHeaders, changeFormatHeaders }: FormatHeadersCheckboxProps) {
  function handleCheckedChange(checked: boolean | 'indeterminate') {
    changeFormatHeaders(checked === true);
  }

  return (
    <div className="flex items-center gap-2">
      <Checkbox id="format-headers" checked={formatHeaders} onCheckedChange={handleCheckedChange} />
      <label
        htmlFor="format-headers"
        className="text-2xs text-text-secondary cursor-pointer select-none hover:text-text-primary transition-colors"
      >
        Format Headers
      </label>
    </div>
  );
}
