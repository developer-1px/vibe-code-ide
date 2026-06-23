import { useMemo } from 'react';
import { JsonExplorerColumnsSection } from '../../../features/JsonExplorerSidebar/ui/JsonExplorerColumnsSection';
import { JsonExplorerDataSourceSection } from '../../../features/JsonExplorerSidebar/ui/JsonExplorerDataSourceSection';
import { JsonExplorerSchemaSection } from '../../../features/JsonExplorerSidebar/ui/JsonExplorerSchemaSection';
import { extractSchemaInterfaces } from '../../../lib/extractKeyPaths';
import type { DataSource } from '../../../lib/loadTestData';

interface JsonExplorerSidebarProps {
  columns: string[];
  allData: Record<string, unknown>[];
  selectPath?: (path: string) => void;
  scrollToColumn?: (columnKey: string) => void;
  dataSource: DataSource;
  changeDataSource: (source: DataSource) => void;
  openCustomJson: () => void;
  selectedSchema: string | null;
  selectSchema: (schemaPath: string | null) => void;
}

export function JsonExplorerSidebar(props: JsonExplorerSidebarProps) {
  const {
    columns,
    allData,
    selectPath,
    scrollToColumn,
    dataSource,
    changeDataSource,
    openCustomJson,
    selectedSchema,
    selectSchema,
  } = props;

  const schemaInterfaces = useMemo(() => {
    const interfaces = extractSchemaInterfaces(allData);
    console.log('[JsonExplorerSidebar] Schema interfaces extracted:', interfaces.length, 'interfaces');
    return interfaces;
  }, [allData]);

  return (
    <div className="w-64 border-r border-border-DEFAULT bg-bg-elevated flex flex-col h-full">
      <JsonExplorerDataSourceSection
        dataSource={dataSource}
        changeDataSource={changeDataSource}
        openCustomJson={openCustomJson}
      />
      <JsonExplorerSchemaSection
        schemaInterfaces={schemaInterfaces}
        selectedSchema={selectedSchema}
        selectSchema={selectSchema}
      />
      <JsonExplorerColumnsSection columns={columns} selectColumn={selectPath} scrollToColumn={scrollToColumn} />
    </div>
  );
}
