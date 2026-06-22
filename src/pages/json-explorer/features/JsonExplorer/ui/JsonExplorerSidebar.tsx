import { useMemo } from 'react';
import { extractSchemaInterfaces } from '../lib/extractKeyPaths';
import type { DataSource } from '../lib/loadTestData';
import { JsonExplorerColumnsSection } from './JsonExplorerColumnsSection';
import { JsonExplorerDataSourceSection } from './JsonExplorerDataSourceSection';
import { JsonExplorerSchemaSection } from './JsonExplorerSchemaSection';

interface JsonExplorerSidebarProps {
  columns: string[]; // 1depth 컬럼 목록
  allData: Record<string, unknown>[]; // 전체 데이터 (schema 분석용)
  onSelectPath?: (path: string) => void;
  onScrollToColumn?: (columnKey: string) => void; // 컬럼 스크롤 콜백
  dataSource: DataSource; // 현재 데이터 소스
  onDataSourceChange: (source: DataSource) => void; // 데이터 소스 변경 콜백
  onCustomJsonClick: () => void; // 커스텀 JSON 입력 모달 열기
  selectedSchema: string | null; // 선택된 스키마 인터페이스 이름
  onSchemaSelect: (schemaPath: string | null) => void; // 스키마 선택 콜백
}

export function JsonExplorerSidebar({
  columns,
  allData,
  onSelectPath,
  onScrollToColumn,
  dataSource,
  onDataSourceChange,
  onCustomJsonClick,
  selectedSchema,
  onSchemaSelect,
}: JsonExplorerSidebarProps) {
  const schemaInterfaces = useMemo(() => {
    const interfaces = extractSchemaInterfaces(allData);
    console.log('[JsonExplorerSidebar] Schema interfaces extracted:', interfaces.length, 'interfaces');
    return interfaces;
  }, [allData]);

  return (
    <div className="w-64 border-r border-border-DEFAULT bg-bg-elevated flex flex-col h-full">
      <JsonExplorerDataSourceSection
        dataSource={dataSource}
        changeDataSource={onDataSourceChange}
        openCustomJson={onCustomJsonClick}
      />
      <JsonExplorerSchemaSection
        schemaInterfaces={schemaInterfaces}
        selectedSchema={selectedSchema}
        selectSchema={onSchemaSelect}
      />
      <JsonExplorerColumnsSection columns={columns} selectColumn={onSelectPath} scrollToColumn={onScrollToColumn} />
    </div>
  );
}
