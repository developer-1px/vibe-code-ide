import Fuse, { type FuseResultMatch } from 'fuse.js';
import { useMemo, useState } from 'react';
import { CustomJsonModal } from './features/CustomJsonModal/ui/CustomJsonModal';
import { extractAllKeyPaths } from './lib/extractKeyPaths';
import { type DataSource, getLimitedData, getTotalCount } from './lib/loadTestData';
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
  const [dataSource, setDataSource] = useState<DataSource>('test.json');
  const [customData, setCustomData] = useState<Record<string, unknown>[]>([]);
  const [customJsonModalOpen, setCustomJsonModalOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);

  function handleScrollToColumnRegister(fn: (columnKey: string) => void) {
    setScrollToColumnFn(() => fn);
  }

  const allProducts = useMemo(
    () => getLimitedData(dataSource, loadedCount, customData),
    [dataSource, loadedCount, customData]
  );
  const totalCount = useMemo(() => getTotalCount(dataSource, customData), [dataSource, customData]);

  function handleDataSourceChange(newSource: DataSource) {
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

  const allColumns = useMemo(() => {
    if (allProducts.length === 0) return [];
    const keysOrder: string[] = [];
    const keysSet = new Set<string>();

    Object.keys(allProducts[0]).forEach((key) => {
      if (key !== '__parentKeyPath') {
        keysOrder.push(key);
        keysSet.add(key);
      }
    });

    allProducts.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== '__parentKeyPath' && !keysSet.has(key)) {
          keysOrder.push(key);
          keysSet.add(key);
        }
      });
    });

    return keysOrder;
  }, [allProducts]);

  const schemaFilteredColumns = useMemo(() => {
    if (!selectedSchema) return allColumns;

    const schemaFields = extractAllKeyPaths(allProducts, 3).filter((path) => {
      if (!selectedSchema) return true;
      return path === selectedSchema || path.startsWith(`${selectedSchema}.`);
    });

    const schemaKeys = new Set(
      schemaFields.map((path) => {
        if (!path) return '';
        const parts = path.split('.');
        return parts[0];
      })
    );

    return allColumns.filter((col) => schemaKeys.has(col));
  }, [allColumns, selectedSchema, allProducts]);

  const fuse = useMemo(() => {
    return new Fuse(allProducts, {
      keys: schemaFilteredColumns,
      threshold: 0.0,
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
    });
  }, [allProducts, schemaFilteredColumns]);

  const { filteredProducts, searchMatches, visibleColumns } = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        filteredProducts: allProducts,
        searchMatches: new Map(),
        visibleColumns: schemaFilteredColumns,
      };
    }

    const results = fuse.search(searchQuery);
    const matches = new Map<number, FuseResultMatch[]>();
    const matchedColumns = new Set<string>();

    const filtered = results.map((result, index) => {
      if (result.matches) {
        matches.set(index, result.matches);
        result.matches.forEach((match) => {
          if (match.key && match.key !== '__parentKeyPath') {
            matchedColumns.add(match.key);
          }
        });
      }
      return result.item;
    });

    const unmatchedColumns = schemaFilteredColumns.filter((col) => !matchedColumns.has(col));
    const columnAvgLengths = unmatchedColumns.map((col) => {
      let totalLength = 0;
      let count = 0;

      filtered.forEach((item) => {
        const value = item[col];
        if (value !== null && value !== undefined) {
          totalLength += String(value).length;
          count++;
        }
      });

      return { col, avgLength: count > 0 ? totalLength / count : 0 };
    });

    const shortColumns = columnAvgLengths
      .sort((a, b) => a.avgLength - b.avgLength)
      .slice(0, 3)
      .map((item) => item.col);

    const visible = schemaFilteredColumns.filter((col) => matchedColumns.has(col) || shortColumns.includes(col));

    return {
      filteredProducts: filtered,
      searchMatches: matches,
      visibleColumns: visible,
    };
  }, [allProducts, searchQuery, fuse, schemaFilteredColumns]);

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
