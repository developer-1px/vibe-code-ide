/**
 * JsonExplorerSidebar - JSON 키 경로 탐색 사이드바
 * DataSource (데이터 소스 선택) + Columns (컬럼 목록) + Schema (키 경로 트리) 세 섹션으로 구성
 */

import { ChevronDown, ChevronRight, Columns, GitBranch, Database, FileJson, Pencil, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { buildKeyPathTree, extractSchemaInterfaces, type KeyPathNode, type SchemaInterfaceNode } from '../lib/extractKeyPaths';
import type { DataSource } from '../lib/loadTestData';

interface JsonExplorerSidebarProps {
  columns: string[]; // 1depth 컬럼 목록
  keyPaths: string[]; // 모든 키 경로 (중첩 포함)
  allData: Record<string, unknown>[]; // 전체 데이터 (schema 분석용)
  onSelectPath?: (path: string) => void;
  onScrollToColumn?: (columnKey: string) => void; // 컬럼 스크롤 콜백
  dataSource: DataSource; // 현재 데이터 소스
  onDataSourceChange: (source: DataSource) => void; // 데이터 소스 변경 콜백
  onCustomJsonClick: () => void; // 커스텀 JSON 입력 모달 열기
  selectedSchema: string | null; // 선택된 스키마 인터페이스 이름
  onSchemaSelect: (schemaPath: string | null) => void; // 스키마 선택 콜백
}

/**
 * Schema Interface Item - TypeScript interface 형식 렌더링
 */
function SchemaInterfaceItem({
  node,
  isSelected,
  onSelect,
}: {
  node: SchemaInterfaceNode;
  isSelected: boolean;
  onSelect: (path: string | null) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleCopyPath = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (error) {
      console.error('Failed to copy path:', error);
    }
  };

  const handleCopyInterface = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // TypeScript interface 코드 생성
      const interfaceCode = `interface ${node.interfaceName} {\n${node.fields
        .map((field) => {
          const displayType = field.isArray ? `${field.type}[]` : field.type;
          const optional = field.isOptional ? '?' : '';
          return `  ${field.name}${optional}: ${displayType};`;
        })
        .join('\n')}\n}`;
      await navigator.clipboard.writeText(interfaceCode);
      setCopiedPath('interface');
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (error) {
      console.error('Failed to copy interface:', error);
    }
  };

  const handleToggle = () => {
    if (isSelected) {
      // 이미 선택된 상태면 선택 해제
      onSelect(null);
      setIsExpanded(false);
    } else {
      // 선택
      onSelect(node.path);
      setIsExpanded(true);
    }
  };

  return (
    <div className="mb-2">
      {/* Interface Header */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-warm-500/10 transition-colors group ${
          isSelected ? 'bg-warm-500/20' : ''
        }`}
        onClick={handleToggle}
      >
        {isExpanded ? (
          <ChevronDown size={10} className="shrink-0 text-text-tertiary" />
        ) : (
          <ChevronRight size={10} className="shrink-0 text-text-tertiary" />
        )}
        <span className={`text-2xs font-semibold font-mono ${isSelected ? 'text-warm-400' : 'text-warm-300'}`}>
          interface {node.interfaceName}
        </span>
        <button
          onClick={handleCopyInterface}
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-bg-elevated rounded"
          title="Copy interface"
          aria-label="Copy interface"
        >
          <Copy size={10} className={copiedPath === 'interface' ? 'text-green-400' : 'text-text-tertiary'} />
        </button>
      </div>

      {/* Path (collapsed) */}
      {!isExpanded && (
        <div className="text-2xs text-text-tertiary font-mono italic px-2 pl-7 pb-1">
          {node.path || 'root'}
        </div>
      )}

      {/* Interface Body (expanded) */}
      {isExpanded && (
        <div className="pl-7 pr-2">
          {/* Opening brace */}
          <div className="text-2xs text-text-tertiary font-mono">{'{'}</div>

          {/* Fields */}
          {node.fields.map((field) => {
            const displayType = field.isArray ? `${field.type}[]` : field.type;
            const optional = field.isOptional ? '?' : '';

            // 타입이 primitive인지 확인 (string, number, boolean, null)
            const isPrimitive = ['string', 'number', 'boolean', 'null', 'unknown'].some(
              (primitiveType) => field.type === primitiveType || field.type.includes(primitiveType)
            );

            // 중첩 객체/배열 타입은 다른 색상 (cyan-400), primitive는 기본 색상 (text-secondary)
            const typeColor = isPrimitive ? 'text-text-secondary' : 'text-cyan-400';

            return (
              <div
                key={field.name}
                className="flex items-center gap-1.5 py-0.5 hover:bg-warm-500/5 group"
              >
                <span className="text-2xs font-mono text-warm-400 pl-2">{field.name}{optional}:</span>
                <span className={`text-2xs font-mono ${typeColor}`}>{displayType};</span>
                <button
                  onClick={(e) => handleCopyPath(field.fullPath, e)}
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-bg-elevated rounded shrink-0"
                  title={`Copy path: ${field.fullPath}`}
                  aria-label="Copy path"
                >
                  <Copy size={9} className={copiedPath === field.fullPath ? 'text-green-400' : 'text-text-tertiary'} />
                </button>
              </div>
            );
          })}

          {/* Closing brace */}
          <div className="text-2xs text-text-tertiary font-mono">{'}'}</div>

          {/* Full path */}
          <div className="text-2xs text-warm-400/60 font-mono italic mt-1">
            // {node.path || 'root'}
          </div>
        </div>
      )}
    </div>
  );
}

function KeyPathTreeItem({ node, onSelect }: { node: KeyPathNode; onSelect?: (path: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onSelect?.(node.fullPath);
  };

  return (
    <div>
      <div
        className="flex items-center gap-1 px-2 py-0.5 text-2xs cursor-pointer hover:bg-bg-deep/50 transition-colors"
        onClick={handleClick}
        style={{ paddingLeft: `${node.depth * 12 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown size={10} className="shrink-0 text-text-tertiary" />
          ) : (
            <ChevronRight size={10} className="shrink-0 text-text-tertiary" />
          )
        ) : (
          <div className="w-2.5 shrink-0" />
        )}
        <span className={`font-mono truncate ${node.isLeaf ? 'text-text-secondary' : 'text-warm-300 font-semibold'}`}>
          {node.key}
        </span>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <KeyPathTreeItem key={child.fullPath} node={child} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export function JsonExplorerSidebar({
  columns,
  keyPaths,
  allData,
  onSelectPath,
  onScrollToColumn,
  dataSource,
  onDataSourceChange,
  onCustomJsonClick,
  selectedSchema,
  onSchemaSelect,
}: JsonExplorerSidebarProps) {
  const tree = useMemo(() => buildKeyPathTree(keyPaths), [keyPaths]);
  const schemaInterfaces = useMemo(() => {
    const interfaces = extractSchemaInterfaces(allData);
    console.log('[JsonExplorerSidebar] Schema interfaces extracted:', interfaces.length, 'interfaces');
    return interfaces;
  }, [allData]);
  const [dataSourceExpanded, setDataSourceExpanded] = useState(true);
  const [schemaExpanded, setSchemaExpanded] = useState(true);
  const [columnsExpanded, setColumnsExpanded] = useState(true);

  const handleColumnClick = (columnKey: string) => {
    onSelectPath?.(columnKey);
    onScrollToColumn?.(columnKey);
  };

  return (
    <div className="w-64 border-r border-border-DEFAULT bg-bg-elevated flex flex-col h-full">
      {/* DataSource Section */}
      <div className="border-b border-border-DEFAULT">
        {/* Section Header */}
        <div
          className="flex items-center gap-2 px-3 py-2 bg-bg-deep cursor-pointer hover:bg-bg-deep/80 transition-colors"
          onClick={() => setDataSourceExpanded(!dataSourceExpanded)}
        >
          {dataSourceExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Database size={12} className="text-warm-300" />
          <h2 className="text-xs font-semibold text-text-primary">Data Source</h2>
        </div>

        {/* DataSource Options */}
        {dataSourceExpanded && (
          <div className="py-1">
            {/* test.json */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 text-2xs cursor-pointer transition-colors ${
                dataSource === 'test.json' ? 'bg-warm-500/20 text-text-primary' : 'text-text-secondary hover:bg-warm-500/10'
              }`}
              onClick={() => onDataSourceChange('test.json')}
            >
              <div className={`w-1 h-1 rounded-full shrink-0 ${dataSource === 'test.json' ? 'bg-warm-400' : 'bg-text-tertiary'}`} />
              <FileJson size={12} className="shrink-0" />
              <span className="font-mono truncate">test.json</span>
            </div>

            {/* test2.json */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 text-2xs cursor-pointer transition-colors ${
                dataSource === 'test2.json' ? 'bg-warm-500/20 text-text-primary' : 'text-text-secondary hover:bg-warm-500/10'
              }`}
              onClick={() => onDataSourceChange('test2.json')}
            >
              <div className={`w-1 h-1 rounded-full shrink-0 ${dataSource === 'test2.json' ? 'bg-warm-400' : 'bg-text-tertiary'}`} />
              <FileJson size={12} className="shrink-0" />
              <span className="font-mono truncate">test2.json</span>
            </div>

            {/* Custom JSON */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 text-2xs cursor-pointer transition-colors ${
                dataSource === 'custom' ? 'bg-warm-500/20 text-text-primary' : 'text-text-secondary hover:bg-warm-500/10'
              }`}
              onClick={onCustomJsonClick}
            >
              <div className={`w-1 h-1 rounded-full shrink-0 ${dataSource === 'custom' ? 'bg-warm-400' : 'bg-text-tertiary'}`} />
              <Pencil size={12} className="shrink-0" />
              <span className="truncate">Custom JSON...</span>
            </div>
          </div>
        )}
      </div>

      {/* Schema Section */}
      <div className="border-b border-border-DEFAULT flex flex-col overflow-hidden">
        {/* Section Header */}
        <div
          className="flex items-center gap-2 px-3 py-2 bg-bg-deep cursor-pointer hover:bg-bg-deep/80 transition-colors shrink-0"
          onClick={() => setSchemaExpanded(!schemaExpanded)}
        >
          {schemaExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <GitBranch size={12} className="text-warm-300" />
          <h2 className="text-xs font-semibold text-text-primary">Schema</h2>
          <span className="text-3xs text-text-tertiary ml-auto">{schemaInterfaces.length} interfaces</span>
        </div>

        {/* Schema Interfaces */}
        {schemaExpanded && (
          <ScrollArea className="flex-1 max-h-[50vh]">
            <div className="py-2">
              {schemaInterfaces.map((interfaceNode) => (
                <SchemaInterfaceItem
                  key={interfaceNode.path}
                  node={interfaceNode}
                  isSelected={selectedSchema === interfaceNode.path}
                  onSelect={onSchemaSelect}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Columns Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Section Header */}
        <div
          className="flex items-center gap-2 px-3 py-2 bg-bg-deep border-b border-border-DEFAULT cursor-pointer hover:bg-bg-deep/80 transition-colors shrink-0"
          onClick={() => setColumnsExpanded(!columnsExpanded)}
        >
          {columnsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Columns size={12} className="text-warm-300" />
          <h2 className="text-xs font-semibold text-text-primary">Columns</h2>
          <span className="text-3xs text-text-tertiary ml-auto">{columns.length}</span>
        </div>

        {/* Columns List */}
        {columnsExpanded && (
          <ScrollArea className="flex-1">
            <div className="py-1">
              {columns.map((col) => (
                <div
                  key={col}
                  className="flex items-center gap-2 px-3 py-0.5 text-2xs cursor-pointer hover:bg-warm-500/10 transition-colors"
                  onClick={() => handleColumnClick(col)}
                >
                  <div className="w-1 h-1 rounded-full bg-warm-300 shrink-0" />
                  <span className="font-mono text-text-secondary truncate">{col}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
