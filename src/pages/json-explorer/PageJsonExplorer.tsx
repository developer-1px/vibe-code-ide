import { useMemo, useState } from 'react';
import {
  getJsonDatasetColumns,
  getJsonDatasetSchemaColumns,
  getJsonDatasetSearchResult,
} from './entities/JsonDataset/lib/computed';
import {
  getJsonDatasetTotalCount,
  getLimitedJsonDatasetRows,
  type JsonDatasetSource,
} from './entities/JsonDataset/lib/dataSource';
import { CustomJsonModal } from './features/CustomJsonModal/ui/CustomJsonModal';
import { JsonDetailsPanel } from './widgets/JsonDetailsPanel/ui/JsonDetailsPanel';
import { JsonExplorerContent } from './widgets/JsonExplorerContent/ui/JsonExplorerContent';
import { JsonExplorerSidebar } from './widgets/JsonExplorerSidebar/ui/JsonExplorerSidebar';

export function PageJsonExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [formatHeaders, setFormatHeaders] = useState(false);
  const [loadedCount, setLoadedCount] = useState(100);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedRowData, setSelectedRowData] = useState<Record<string, unknown> | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [scrollToColumnFn, setScrollToColumnFn] = useState<((columnKey: string) => void) | null>(null);
  const [dataSource, setDataSource] = useState<JsonDatasetSource>('test.json');
  const [customData, setCustomData] = useState<Record<string, unknown>[]>([]);
  const [customJsonModalOpen, setCustomJsonModalOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);

  function handleScrollToColumnRegister(fn: (columnKey: string) => void) {
    setScrollToColumnFn(() => fn);
  }

  const allProducts = useMemo(
    () => getLimitedJsonDatasetRows(dataSource, loadedCount, customData),
    [dataSource, loadedCount, customData]
  );
  const totalCount = useMemo(() => getJsonDatasetTotalCount(dataSource, customData), [dataSource, customData]);

  function handleDataSourceChange(newSource: JsonDatasetSource) {
    setDataSource(newSource);
    setLoadedCount(100);
    setSearchQuery('');
    setSelectedRowIndex(null);
    setSelectedRowData(null);
  }

  function handleCustomJsonSubmit(data: Record<string, unknown>[]) {
    setCustomData(data);
    setDataSource('custom');
    setLoadedCount(100);
    setSearchQuery('');
    setSelectedRowIndex(null);
    setSelectedRowData(null);
  }

  const allColumns = useMemo(() => getJsonDatasetColumns(allProducts), [allProducts]);
  const schemaFilteredColumns = useMemo(
    () => getJsonDatasetSchemaColumns(allColumns, allProducts, selectedSchema),
    [allColumns, selectedSchema, allProducts]
  );
  const {
    filteredRows: filteredProducts,
    searchMatches,
    visibleColumns,
  } = useMemo(
    () => getJsonDatasetSearchResult(allProducts, schemaFilteredColumns, searchQuery),
    [allProducts, searchQuery, schemaFilteredColumns]
  );

  function handlePathSelect(path: string) {
    console.log('Selected key path:', path);
  }

  function handleRowsLoadMore() {
    if (loadedCount < totalCount) {
      setLoadedCount((prev) => Math.min(prev + 100, totalCount));
    }
  }

  function handleRowSelect(index: number, data: Record<string, unknown>) {
    setSelectedRowIndex(index);
    setSelectedRowData(data);
    if (!rightPanelOpen) {
      setRightPanelOpen(true);
    }
  }

  function handleDetailsPanelClose() {
    setRightPanelOpen(false);
    setSelectedRowIndex(null);
    setSelectedRowData(null);
  }

  function handleColumnScroll(columnKey: string) {
    scrollToColumnFn?.(columnKey);
  }

  function handleCustomJsonModalOpen() {
    setCustomJsonModalOpen(true);
  }

  function handleSchemaSelect(schemaPath: string | null) {
    setSelectedSchema(schemaPath);
  }

  function handleCustomJsonModalClose() {
    setCustomJsonModalOpen(false);
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 overflow-hidden">
      <JsonExplorerSidebar
        columns={visibleColumns}
        allData={allProducts}
        selectPath={handlePathSelect}
        scrollToColumn={handleColumnScroll}
        dataSource={dataSource}
        changeDataSource={handleDataSourceChange}
        openCustomJson={handleCustomJsonModalOpen}
        selectedSchema={selectedSchema}
        selectSchema={handleSchemaSelect}
      />

      <JsonExplorerContent
        formatHeaders={formatHeaders}
        changeFormatHeaders={setFormatHeaders}
        exportData={filteredProducts}
        rightPanelOpen={rightPanelOpen}
        changeRightPanelOpen={setRightPanelOpen}
        searchQuery={searchQuery}
        changeSearchQuery={setSearchQuery}
        data={filteredProducts}
        totalCount={totalCount}
        loadMoreRows={handleRowsLoadMore}
        searchMatches={searchMatches}
        selectedRowIndex={selectedRowIndex}
        selectRow={handleRowSelect}
        registerScrollToColumn={handleScrollToColumnRegister}
        visibleColumns={visibleColumns}
      />

      {rightPanelOpen && <JsonDetailsPanel data={selectedRowData} closePanel={handleDetailsPanelClose} />}

      <CustomJsonModal
        isOpen={customJsonModalOpen}
        closeModal={handleCustomJsonModalClose}
        submitJson={handleCustomJsonSubmit}
      />
    </div>
  );
}
