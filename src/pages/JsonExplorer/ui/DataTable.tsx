/**
 * DataTable - TanStack Table 기반 동적 JSON 테이블
 * JSON 데이터를 분석하여 모든 키를 자동으로 컬럼으로 생성
 * 가상화 + 무한 스크롤 지원
 */

import {
  type ColumnDef,
  type ColumnResizeMode,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import type Fuse from 'fuse.js';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * JSON 데이터에서 모든 키를 추출 (코드 노출 순서 유지)
 */
function extractAllKeys(data: Record<string, unknown>[]): string[] {
  if (data.length === 0) return [];

  const keysOrder: string[] = [];
  const keysSet = new Set<string>();

  // 첫 번째 객체의 키 순서를 기준으로 설정
  if (data.length > 0) {
    Object.keys(data[0]).forEach((key) => {
      keysOrder.push(key);
      keysSet.add(key);
    });
  }

  // 나머지 객체에서 누락된 키 추가
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (!keysSet.has(key)) {
        keysOrder.push(key);
        keysSet.add(key);
      }
    });
  });

  return keysOrder; // 코드 노출 순서 유지
}

/**
 * 키 이름을 Header 텍스트로 변환
 * camelCase -> Title Case
 */
function formatHeader(key: string): string {
  // camelCase를 공백으로 구분
  const withSpaces = key.replace(/([A-Z])/g, ' $1');
  // 첫 글자 대문자
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

/**
 * 텍스트에 하이라이트 적용 (더 강한 스타일)
 */
function highlightText(text: string, indices: readonly [number, number][]): React.ReactNode {
  if (!indices || indices.length === 0) {
    return text;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  indices.forEach(([start, end], i) => {
    // 매칭 전 텍스트
    if (start > lastIndex) {
      parts.push(<span key={`text-${i}`}>{text.slice(lastIndex, start)}</span>);
    }
    // 매칭된 텍스트 (밝은 하이라이트)
    parts.push(
      <mark
        key={`match-${i}`}
        className="bg-warm-400 text-white font-semibold px-0.5 rounded-sm"
        style={{ boxShadow: '0 0 0 1px rgba(251, 191, 36, 0.3)' }}
      >
        {text.slice(start, end + 1)}
      </mark>
    );
    lastIndex = end + 1;
  });

  // 남은 텍스트
  if (lastIndex < text.length) {
    parts.push(<span key="text-end">{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

/**
 * 값 렌더링 (타입별 스타일링) - Dense Mode
 */
function renderCellValue(value: unknown, matchIndices?: readonly [number, number][]): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-text-tertiary italic text-3xs">null</span>;
  }

  if (typeof value === 'boolean') {
    return <span className={`text-3xs ${value ? 'text-green-400' : 'text-red-400'}`}>{value ? 'true' : 'false'}</span>;
  }

  if (typeof value === 'number') {
    const text = String(value);
    return (
      <span className="font-mono text-2xs text-text-tertiary">
        {matchIndices ? highlightText(text, matchIndices) : text}
      </span>
    );
  }

  if (typeof value === 'string') {
    const content = matchIndices ? highlightText(value, matchIndices) : value;

    return (
      <span className="block text-2xs text-text-tertiary" title={value}>
        {content}
      </span>
    );
  }

  // 객체나 배열은 JSON 문자열로 표시
  const jsonStr = JSON.stringify(value);
  return (
    <span className="text-3xs text-text-disabled block" title={jsonStr}>
      {jsonStr}
    </span>
  );
}

interface DataTableProps {
  data: Record<string, unknown>[];
  totalCount: number;
  formatHeaders?: boolean; // Header 포맷팅 옵션 (기본값: false)
  onLoadMore?: () => void; // 무한 스크롤 콜백
  searchMatches?: Map<number, Fuse.FuseResultMatch[]>; // 검색 매칭 정보
  searchQuery?: string; // 검색어
  selectedRowIndex?: number | null; // 선택된 행 인덱스
  onRowSelect?: (index: number, data: Record<string, unknown>) => void; // 행 선택 콜백
  onScrollToColumn?: (columnKey: string) => void; // 컬럼 스크롤 콜백 등록
  visibleColumns?: string[]; // 표시할 컬럼 목록 (검색 필터링용)
}

export function DataTable({
  data,
  totalCount,
  formatHeaders = false,
  onLoadMore,
  searchMatches,
  searchQuery,
  selectedRowIndex,
  onRowSelect,
  onScrollToColumn,
  visibleColumns,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const headerRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());
  const scrollLeftRef = useRef<number>(0); // 가로 스크롤 위치 저장

  // 컬럼 너비 자동 계산 (하이브리드: 데이터 기반 + 제약)
  const columnWidths = useMemo(() => {
    const allKeys = extractAllKeys(data);
    const keys = visibleColumns || allKeys;
    const widths = new Map<string, number>();

    // 샘플링 (최대 1000개)
    const sampleSize = Math.min(1000, data.length);

    keys.forEach((key) => {
      let maxLength = key.length; // 헤더 길이로 시작

      // 샘플 데이터에서 최대 길이 찾기
      for (let i = 0; i < sampleSize; i++) {
        const value = data[i]?.[key];
        if (value !== null && value !== undefined) {
          const strValue = String(value);
          maxLength = Math.max(maxLength, strValue.length);
        }
      }

      // 문자 길이를 픽셀로 변환 (평균 7px per char) + 패딩(24px)
      let pixelWidth = maxLength * 7 + 24;

      // 최소/최대 제약 적용
      const MIN_WIDTH = 80;
      const MAX_WIDTH = 600;
      pixelWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, pixelWidth));

      widths.set(key, pixelWidth);
    });

    return widths;
  }, [data, visibleColumns]);

  // 동적으로 컬럼 생성 (visibleColumns로 필터링 + 너비 설정)
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const allKeys = extractAllKeys(data);
    // visibleColumns가 제공되면 해당 컬럼만, 아니면 모든 컬럼
    const keys = visibleColumns || allKeys;

    return keys.map((key, _index) => ({
      accessorKey: key,
      header: formatHeaders ? formatHeader(key) : key, // 포맷팅 옵션 적용
      size: columnWidths.get(key) || 150, // 계산된 너비 적용
      minSize: 80, // 최소 너비
      maxSize: 800, // 최대 너비
      enableResizing: true, // 리사이징 활성화
      cell: ({ row }) => {
        const value = row.getValue(key);
        const rowIndex = row.index;

        // 검색 매칭 정보 가져오기
        const matches = searchMatches?.get(rowIndex);
        const matchIndices = matches?.find((m) => m.key === key)?.indices;

        return renderCellValue(value, matchIndices);
      },
    }));
  }, [data, formatHeaders, searchMatches, visibleColumns, columnWidths]);

  const table = useReactTable({
    data,
    columns,
    columnResizeMode,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  const { rows } = table.getRowModel();

  // 가상화 설정
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 24, // h-6 = 24px
    overscan: 10, // 스크롤 성능 최적화
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // 무한 스크롤 감지
  const lastItem = virtualRows[virtualRows.length - 1];
  if (lastItem && lastItem.index >= rows.length - 1 && data.length < totalCount && onLoadMore) {
    onLoadMore();
  }

  // 검색 매칭 개수 계산
  const totalMatches = useMemo(() => {
    if (!searchMatches || searchMatches.size === 0) return 0;
    let count = 0;
    searchMatches.forEach((matches) => {
      matches.forEach((match) => {
        if (match.indices) {
          count += match.indices.length;
        }
      });
    });
    return count;
  }, [searchMatches]);

  // 컬럼 스크롤 함수
  const scrollToColumn = (columnKey: string) => {
    const headerCell = headerRefs.current.get(columnKey);
    const container = tableContainerRef.current;

    if (!headerCell || !container) return;

    // 헤더 셀로 스크롤
    headerCell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    // 하이라이트 효과
    headerCell.classList.add('animate-pulse');
    setTimeout(() => {
      headerCell.classList.remove('animate-pulse');
    }, 1500);
  };

  // 스크롤 함수 등록
  useEffect(() => {
    if (onScrollToColumn) {
      onScrollToColumn(scrollToColumn);
    }
  }, [onScrollToColumn, scrollToColumn]);

  // 가로 스크롤 위치 저장 및 복원
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    // 스크롤 이벤트 핸들러
    const handleScroll = () => {
      // 가로 스크롤 위치 저장
      scrollLeftRef.current = container.scrollLeft;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 가상화로 인한 리렌더 시 가로 스크롤 위치 복원
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    // 저장된 가로 스크롤 위치 복원
    if (scrollLeftRef.current !== container.scrollLeft) {
      container.scrollLeft = scrollLeftRef.current;
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Table Info - Dense */}
      <div className="px-3 py-1.5 border-b border-border-DEFAULT bg-bg-elevated flex items-center justify-between">
        <p className="text-2xs text-text-tertiary">
          Showing {data.length} of {totalCount.toLocaleString()} rows
        </p>
        {searchQuery && totalMatches > 0 && (
          <p className="text-2xs text-warm-500 font-semibold">
            <mark className="bg-warm-400 text-white font-semibold px-1 py-0.5 rounded-sm">
              {totalMatches.toLocaleString()}
            </mark>{' '}
            matches found
          </p>
        )}
      </div>

      {/* Table - Virtualized */}
      <div ref={tableContainerRef} className="flex-1 overflow-auto relative">
        <table className="caption-bottom text-sm w-full table-fixed">
          <thead className="sticky top-0 z-10 [&_tr]:border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="h-7 bg-bg-elevated border-b border-border-DEFAULT">
                {headerGroup.headers.map((header) => {
                  const columnKey = String(header.column.columnDef.accessorKey || header.id);
                  const width = header.column.getSize();
                  return (
                    <th
                      key={header.id}
                      ref={(el) => {
                        if (el) {
                          headerRefs.current.set(columnKey, el);
                        }
                      }}
                      className="h-7 px-3 py-1 text-left align-middle text-2xs font-semibold text-text-secondary bg-bg-elevated overflow-hidden text-ellipsis transition-colors relative border-r border-border-DEFAULT"
                      style={{ width: `${width}px` }}
                    >
                      <div className="truncate" title={String(header.column.columnDef.header)}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                      {/* Resize Handle */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-warm-400 ${
                            header.column.getIsResizing() ? 'bg-warm-400' : ''
                          }`}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {rows.length > 0 ? (
              <>
                {/* Spacer before virtual items */}
                {virtualRows.length > 0 && virtualRows[0].start > 0 && (
                  <tr>
                    <td style={{ height: `${virtualRows[0].start}px` }} />
                  </tr>
                )}

                {/* Virtual rows */}
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  const isSelected = selectedRowIndex === virtualRow.index;

                  return (
                    <tr
                      key={row.id}
                      className={`h-6 border-b border-border-DEFAULT transition-colors cursor-pointer ${
                        isSelected ? 'bg-warm-500/20' : 'hover:bg-warm-500/10'
                      }`}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      onClick={() => onRowSelect?.(virtualRow.index, row.original)}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const width = cell.column.getSize();
                        return (
                          <td
                            key={cell.id}
                            className="px-3 py-0.5 text-2xs align-middle overflow-hidden border-r border-border-DEFAULT"
                            style={{ width: `${width}px` }}
                          >
                            <div className="truncate">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Spacer after virtual items */}
                {virtualRows.length > 0 && (
                  <tr>
                    <td style={{ height: `${totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)}px` }} />
                  </tr>
                )}
              </>
            ) : (
              <tr className="border-b border-border-DEFAULT">
                <td colSpan={columns.length} className="h-20 text-center text-xs p-2 align-middle text-text-tertiary">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
