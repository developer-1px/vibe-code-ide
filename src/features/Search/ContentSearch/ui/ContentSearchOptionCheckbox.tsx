import type React from 'react';

interface ContentSearchOptionCheckboxProps {
  label: string;
  checked: boolean;
  changeChecked: (checked: boolean) => void;
}

export function ContentSearchOptionCheckbox({ label, checked, changeChecked }: ContentSearchOptionCheckboxProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    changeChecked(e.target.checked);
  }

  return (
    <label className="flex items-center gap-1.5 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={handleChange} className="rounded" />
      <span className="text-text-secondary">{label}</span>
    </label>
  );
}
