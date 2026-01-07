/**
 * JsonExplorer - JSON 데이터 탐색 독립 페이지
 * test.json의 서버 제품 리스트를 테이블로 표시
 * 자체 Left/Right Panel을 가진 독립적인 레이아웃
 */

import { useCallback, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { PanelRightOpen, PanelRightClose } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { extractAllKeyPaths } from './lib/extractKeyPaths';
import { getLimitedData, getTotalCount, type DataSource } from './lib/loadTestData';
import { DataTable } from './ui/DataTable';
import { JsonExplorerSidebar } from './ui/JsonExplorerSidebar';
import { SearchBar } from './ui/SearchBar';
import { ExportButton } from './ui/ExportButton';
import { JsonDetailsPanel } from './ui/JsonDetailsPanel';
import { CustomJsonModal } from './ui/CustomJsonModal';

export function JsonExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [formatHeaders, setFormatHeaders] = useState(false);
  const [loadedCount, setLoadedCount] = useState(100); // 초기 100개
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedRowData, setSelectedRowData] = useState<Record<string, unknown> | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [scrollToColumnFn, setScrollToColumnFn] = useState<((columnKey: string) => void) | null>(null);

  // 데이터 소스 관리
  const [dataSource, setDataSource] = useState<DataSource>('test.json');
  const [customData, setCustomData] = useState<Record<string, unknown>[]>([]);
  const [customJsonModalOpen, setCustomJsonModalOpen] = useState(false);

  // 스키마 선택 관리
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);

  // onScrollToColumn 핸들러를 useCallback으로 안정화
  const handleSetScrollToColumn = useCallback((fn: (columnKey: string) => void) => {
    setScrollToColumnFn(() => fn);
  }, []);

  // 로드된 만큼의 데이터
  const allProducts = useMemo(() => getLimitedData(dataSource, loadedCount, customData), [dataSource, loadedCount, customData]);
  const totalCount = useMemo(() => getTotalCount(dataSource, customData), [dataSource, customData]);

  // 데이터 소스 변경 핸들러
  const handleDataSourceChange = (newSource: DataSource) => {
    setDataSource(newSource);
    setLoadedCount(100); // 초기 로드 개수로 리셋
    setSearchQuery(''); // 검색어 초기화
    setSelectedRowIndex(null); // 선택 초기화
    setSelectedRowData(null);
  };

  // 커스텀 JSON 제출 핸들러
  const handleCustomJsonSubmit = (data: Record<string, unknown>[]) => {
    setCustomData(data);
    setDataSource('custom');
    setLoadedCount(100);
    setSearchQuery('');
    setSelectedRowIndex(null);
    setSelectedRowData(null);
  };

  // 1depth 컬럼 목록 추출 (__parentKeyPath 제외)
  const allColumns = useMemo(() => {
    if (allProducts.length === 0) return [];
    const keysOrder: string[] = [];
    const keysSet = new Set<string>();

    // 첫 번째 객체의 키 순서를 기준으로 설정
    Object.keys(allProducts[0]).forEach((key) => {
      if (key !== '__parentKeyPath') {
        keysOrder.push(key);
        keysSet.add(key);
      }
    });

    // 나머지 객체에서 누락된 키 추가
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

  // 스키마 선택 시 해당 스키마의 필드만 필터링
  const schemaFilteredColumns = useMemo(() => {
    if (!selectedSchema) return allColumns;

    // 선택된 스키마의 필드 경로 추출
    const schemaFields = extractAllKeyPaths(allProducts, 3).filter((path) => {
      // path가 빈 문자열이면 root, 아니면 선택된 스키마로 시작해야 함
      if (!selectedSchema) return true;
      return path === selectedSchema || path.startsWith(`${selectedSchema}.`);
    });

    // 필드 경로를 1depth 키로 변환 (예: "a.b.c" -> "a")
    const schemaKeys = new Set(
      schemaFields.map((path) => {
        if (!path) return '';
        const parts = path.split('.');
        return parts[0];
      })
    );

    // 원래 순서 유지하면서 스키마 키만 필터링
    return allColumns.filter((col) => schemaKeys.has(col));
  }, [allColumns, selectedSchema, allProducts]);

  // 모든 키 경로 추출 (중첩 포함)
  const keyPaths = useMemo(() => extractAllKeyPaths(allProducts, 3), [allProducts]);

  // Fuse.js 설정 (스키마 필터링 적용)
  const fuse = useMemo(() => {
    return new Fuse(allProducts, {
      keys: schemaFilteredColumns, // 스키마 필터링된 컬럼에서만 검색
      threshold: 0.0, // 완전 일치만 허용 (0 = 정확한 검색, 0.3 = 퍼지 검색)
      includeScore: true,
      includeMatches: true, // 매칭된 위치 정보 포함
      ignoreLocation: true, // 문자열 위치 무시 (전체 문자열 검색)
    });
  }, [allProducts, schemaFilteredColumns]);

  // 검색 필터링 및 표시 컬럼 전략적 선택
  const { filteredProducts, searchMatches, visibleColumns } = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        filteredProducts: allProducts,
        searchMatches: new Map(),
        visibleColumns: schemaFilteredColumns, // 스키마 필터링된 컬럼 표시
      };
    }

    const results = fuse.search(searchQuery);
    const matches = new Map<number, Fuse.FuseResultMatch[]>();
    const matchedColumns = new Set<string>();

    const filtered = results.map((result, index) => {
      // 매칭 정보 저장
      if (result.matches) {
        matches.set(index, result.matches);
        // 매칭된 컬럼 수집
        result.matches.forEach((match) => {
          if (match.key && match.key !== '__parentKeyPath') {
            matchedColumns.add(match.key);
          }
        });
      }
      return result.item;
    });

    // 전략적 컬럼 선택: 매칭된 컬럼 + 중요한 컬럼만 표시
    // 1. 매칭된 컬럼은 무조건 포함
    // 2. 매칭되지 않은 컬럼 중 평균 길이가 짧은 것만 추가 (최대 3개)
    const unmatchedColumns = schemaFilteredColumns.filter((col) => !matchedColumns.has(col));

    // 각 컬럼의 평균 문자열 길이 계산
    const columnAvgLengths = unmatchedColumns.map((col) => {
      let totalLength = 0;
      let count = 0;

      filtered.forEach((item) => {
        const value = item[col];
        if (value !== null && value !== undefined) {
          const strValue = String(value);
          totalLength += strValue.length;
          count++;
        }
      });

      const avgLength = count > 0 ? totalLength / count : 0;
      return { col, avgLength };
    });

    // 평균 길이가 짧은 순으로 정렬하여 최대 3개만 선택
    const shortColumns = columnAvgLengths
      .sort((a, b) => a.avgLength - b.avgLength)
      .slice(0, 3)
      .map((item) => item.col);

    // 매칭된 컬럼 + 짧은 컬럼 (원래 순서 유지)
    const visible = schemaFilteredColumns.filter((col) => matchedColumns.has(col) || shortColumns.includes(col));

    return {
      filteredProducts: filtered,
      searchMatches: matches,
      visibleColumns: visible,
    };
  }, [allProducts, searchQuery, fuse, schemaFilteredColumns]);

  const handleSelectPath = (path: string) => {
    console.log('Selected key path:', path);
  };

  // 무한 스크롤: 100개씩 추가 로드
  const handleLoadMore = () => {
    if (loadedCount < totalCount) {
      setLoadedCount((prev) => Math.min(prev + 100, totalCount));
    }
  };

  // 행 선택 핸들러
  const handleRowSelect = (index: number, data: Record<string, unknown>) => {
    setSelectedRowIndex(index);
    setSelectedRowData(data);
    if (!rightPanelOpen) {
      setRightPanelOpen(true);
    }
  };

  // 우측 패널 닫기
  const handleClosePanel = () => {
    setRightPanelOpen(false);
    setSelectedRowIndex(null);
    setSelectedRowData(null);
  };

  // 컬럼 스크롤 핸들러
  const handleScrollToColumn = (columnKey: string) => {
    scrollToColumnFn?.(columnKey);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Panel - DataSource + Schema + Columns */}
      <JsonExplorerSidebar
        columns={visibleColumns}
        keyPaths={keyPaths}
        allData={allProducts}
        onSelectPath={handleSelectPath}
        onScrollToColumn={handleScrollToColumn}
        dataSource={dataSource}
        onDataSourceChange={handleDataSourceChange}
        onCustomJsonClick={() => setCustomJsonModalOpen(true)}
        selectedSchema={selectedSchema}
        onSchemaSelect={setSelectedSchema}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 bg-bg-elevated min-w-0">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-border-DEFAULT bg-bg-deep shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold text-text-primary">JSON Explorer</h1>
              <p className="text-2xs text-text-tertiary mt-0.5">Explore test.json data (Server Product Price List)</p>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Format Headers Toggle */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="format-headers"
                  checked={formatHeaders}
                  onCheckedChange={(checked) => setFormatHeaders(checked === true)}
                />
                <label
                  htmlFor="format-headers"
                  className="text-2xs text-text-secondary cursor-pointer select-none hover:text-text-primary transition-colors"
                >
                  Format Headers
                </label>
              </div>

              {/* Export Button */}
              <ExportButton data={filteredProducts} filename="json-export" />

              {/* Right Panel Toggle */}
              <button
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                className="p-1.5 hover:bg-bg-elevated rounded transition-colors"
                aria-label="Toggle details panel"
                title={rightPanelOpen ? 'Close details panel' : 'Open details panel'}
              >
                {rightPanelOpen ? (
                  <PanelRightClose size={16} className="text-warm-400" />
                ) : (
                  <PanelRightOpen size={16} className="text-text-tertiary" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="shrink-0">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by code, name, or generation..."
          />
        </div>

        {/* Data Table */}
        <div className="flex-1 min-h-0">
          <DataTable
            data={filteredProducts}
            totalCount={totalCount}
            formatHeaders={formatHeaders}
            onLoadMore={handleLoadMore}
            searchMatches={searchMatches}
            searchQuery={searchQuery}
            selectedRowIndex={selectedRowIndex}
            onRowSelect={handleRowSelect}
            onScrollToColumn={handleSetScrollToColumn}
            visibleColumns={visibleColumns}
          />
        </div>
      </div>

      {/* Right Panel - Details */}
      {rightPanelOpen && <JsonDetailsPanel data={selectedRowData} onClose={handleClosePanel} />}

      {/* Custom JSON Modal */}
      <CustomJsonModal isOpen={customJsonModalOpen} onClose={() => setCustomJsonModalOpen(false)} onSubmit={handleCustomJsonSubmit} />
    </div>
  );
}
