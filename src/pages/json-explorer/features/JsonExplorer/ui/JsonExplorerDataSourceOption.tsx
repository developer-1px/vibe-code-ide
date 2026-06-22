import type { LucideIcon } from 'lucide-react';
import type { DataSource } from '../lib/loadTestData';

interface JsonExplorerDataSourceOptionProps {
  active: boolean;
  icon: LucideIcon;
  label: string;
  mono?: boolean;
  source?: DataSource;
  changeDataSource: (source: DataSource) => void;
  openCustomJson: () => void;
}

export function JsonExplorerDataSourceOption({
  active,
  icon: Icon,
  label,
  mono = false,
  source,
  changeDataSource,
  openCustomJson,
}: JsonExplorerDataSourceOptionProps) {
  function handleClick() {
    if (source) {
      changeDataSource(source);
      return;
    }

    openCustomJson();
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 text-2xs cursor-pointer transition-colors ${
        active ? 'bg-warm-500/20 text-text-primary' : 'text-text-secondary hover:bg-warm-500/10'
      }`}
      onClick={handleClick}
    >
      <div className={`w-1 h-1 rounded-full shrink-0 ${active ? 'bg-warm-400' : 'bg-text-tertiary'}`} />
      <Icon size={12} className="shrink-0" />
      <span className={`${mono ? 'font-mono ' : ''}truncate`}>{label}</span>
    </div>
  );
}
