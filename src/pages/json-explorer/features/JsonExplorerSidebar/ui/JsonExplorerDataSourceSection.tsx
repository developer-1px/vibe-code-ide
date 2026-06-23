import { ChevronDown, ChevronRight, Database, FileJson, Pencil } from 'lucide-react';
import { useState } from 'react';
import type { JsonDatasetSource } from '../../../entities/JsonDataset/lib/dataSource';
import { JsonExplorerDataSourceOption } from './JsonExplorerDataSourceOption';

interface JsonExplorerDataSourceSectionProps {
  dataSource: JsonDatasetSource;
  changeDataSource: (source: JsonDatasetSource) => void;
  openCustomJson: () => void;
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
          <JsonExplorerDataSourceOption
            active={dataSource === 'test.json'}
            icon={FileJson}
            label="test.json"
            mono
            source="test.json"
            changeDataSource={changeDataSource}
            openCustomJson={openCustomJson}
          />
          <JsonExplorerDataSourceOption
            active={dataSource === 'test2.json'}
            icon={FileJson}
            label="test2.json"
            mono
            source="test2.json"
            changeDataSource={changeDataSource}
            openCustomJson={openCustomJson}
          />
          <JsonExplorerDataSourceOption
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
