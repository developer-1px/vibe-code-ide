import { ChevronDown, ChevronRight, Database, FileJson, type LucideIcon, Pencil } from 'lucide-react';
import { useState } from 'react';
import type { DataSource } from '../lib/loadTestData';

interface JsonExplorerDataSourceSectionProps {
  dataSource: DataSource;
  changeDataSource: (source: DataSource) => void;
  openCustomJson: () => void;
}

function DataSourceOption({
  active,
  icon: Icon,
  label,
  mono = false,
  source,
  changeDataSource,
  openCustomJson,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  mono?: boolean;
  source?: DataSource;
  changeDataSource: (source: DataSource) => void;
  openCustomJson: () => void;
}) {
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

export function JsonExplorerDataSourceSection({
  dataSource,
  changeDataSource,
  openCustomJson,
}: JsonExplorerDataSourceSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  function handleToggle() {
    setIsExpanded(!isExpanded);
  }

  return (
    <div className="border-b border-border-DEFAULT">
      <div
        className="flex items-center gap-2 px-3 py-2 bg-bg-deep cursor-pointer hover:bg-bg-deep/80 transition-colors"
        onClick={handleToggle}
      >
        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Database size={12} className="text-warm-300" />
        <h2 className="text-xs font-semibold text-text-primary">Data Source</h2>
      </div>

      {isExpanded && (
        <div className="py-1">
          <DataSourceOption
            active={dataSource === 'test.json'}
            icon={FileJson}
            label="test.json"
            mono
            source="test.json"
            changeDataSource={changeDataSource}
            openCustomJson={openCustomJson}
          />
          <DataSourceOption
            active={dataSource === 'test2.json'}
            icon={FileJson}
            label="test2.json"
            mono
            source="test2.json"
            changeDataSource={changeDataSource}
            openCustomJson={openCustomJson}
          />
          <DataSourceOption
            active={dataSource === 'custom'}
            icon={Pencil}
            label="Custom JSON..."
            changeDataSource={changeDataSource}
            openCustomJson={openCustomJson}
          />
        </div>
      )}
    </div>
  );
}
