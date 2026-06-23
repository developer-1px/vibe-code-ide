import type { FuseResultMatch } from 'fuse.js';
import { DataTable } from '../../../features/JsonDataTable/ui/DataTable';
import { JsonExplorerHeader } from '../../../features/JsonExplorerHeader/ui/JsonExplorerHeader';
import { SearchBar } from '../../../features/JsonExplorerHeader/ui/SearchBar';

interface JsonExplorerContentProps {
  formatHeaders: boolean;
  changeFormatHeaders: (formatHeaders: boolean) => void;
  exportData: Record<string, unknown>[];
  rightPanelOpen: boolean;
  changeRightPanelOpen: (open: boolean) => void;
  searchQuery: string;
  changeSearchQuery: (query: string) => void;
  data: Record<string, unknown>[];
  totalCount: number;
  loadMoreRows: () => void;
  searchMatches: Map<number, FuseResultMatch[]>;
  selectedRowIndex: number | null;
  selectRow: (index: number, data: Record<string, unknown>) => void;
  registerScrollToColumn: (fn: (columnKey: string) => void) => void;
  visibleColumns: string[];
}

export function JsonExplorerContent({
  formatHeaders,
  changeFormatHeaders,
  exportData,
  rightPanelOpen,
  changeRightPanelOpen,
  searchQuery,
  changeSearchQuery,
  data,
  totalCount,
  loadMoreRows,
  searchMatches,
  selectedRowIndex,
  selectRow,
  registerScrollToColumn,
  visibleColumns,
}: JsonExplorerContentProps) {
  return (
    <div className="flex flex-col flex-1 bg-bg-elevated min-w-0">
      <JsonExplorerHeader
        formatHeaders={formatHeaders}
        changeFormatHeaders={changeFormatHeaders}
        exportData={exportData}
        rightPanelOpen={rightPanelOpen}
        changeRightPanelOpen={changeRightPanelOpen}
      />

      <div className="shrink-0">
        <SearchBar
          value={searchQuery}
          changeValue={changeSearchQuery}
          placeholder="Search by code, name, or generation..."
        />
      </div>

      <div className="flex-1 min-h-0">
        <DataTable
          data={data}
          totalCount={totalCount}
          formatHeaders={formatHeaders}
          loadMore={loadMoreRows}
          searchMatches={searchMatches}
          searchQuery={searchQuery}
          selectedRowIndex={selectedRowIndex}
          selectRow={selectRow}
          registerScrollToColumn={registerScrollToColumn}
          visibleColumns={visibleColumns}
        />
      </div>
    </div>
  );
}
