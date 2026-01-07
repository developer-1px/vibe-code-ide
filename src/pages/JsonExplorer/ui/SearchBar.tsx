/**
 * SearchBar - JSON Explorer 검색 바
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search products...' }: SearchBarProps) {
  return (
    <div className="relative flex items-center gap-2 px-3 py-2 border-b border-border-DEFAULT bg-bg-elevated">
      <Search className="absolute left-5 w-3.5 h-3.5 text-text-tertiary" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8 h-7 text-2xs bg-bg-deep border-border-DEFAULT text-text-primary placeholder:text-text-tertiary"
      />
    </div>
  );
}
