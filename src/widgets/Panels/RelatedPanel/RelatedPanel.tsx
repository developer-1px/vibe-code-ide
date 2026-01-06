import { useAtomValue } from 'jotai';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { graphDataAtom } from '@/app/model/atoms';
import { analyzeDependencies, type DependencyItem } from '@/shared/dependencyAnalyzer';
import { FileIcon } from '@/entities/SourceFileNode/ui/FileIcon';
import { RelatedPanelItem } from './RelatedPanelItem';
import { EntityItem } from './EntityItem';

export interface RelatedPanelProps {
  /** 현재 파일 경로 (이 파일의 의존성을 분석) */
  currentFilePath: string | null;
}

/**
 * RelatedPanel - 파일 의존성 탐색 뷰
 *
 * 현재 파일이 import하는 모든 파일을 재귀적으로 찾아서 토폴로지 정렬하여 표시
 * - Local Files: 프로젝트 내 파일들 (토폴로지 순서)
 * - NPM Modules: 외부 패키지들 (접기 가능)
 */
export function RelatedPanel({ currentFilePath }: RelatedPanelProps) {
  const graphData = useAtomValue(graphDataAtom);
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [entitiesSectionCollapsed, setEntitiesSectionCollapsed] = useState(false); // ENTITIES 섹션 기본 펼쳐진 상태
  const [entityFileCollapseStates, setEntityFileCollapseStates] = useState<Map<string, boolean>>(new Map()); // 파일별 접기/펼치기
  const [npmSectionCollapsed, setNpmSectionCollapsed] = useState(true); // NPM 섹션 기본 접힌 상태
  const [importedBySectionCollapsed, setImportedBySectionCollapsed] = useState(false); // IMPORTED BY 섹션
  const [importedByDirectSubsectionCollapsed, setImportedByDirectSubsectionCollapsed] = useState(false); // Imported By Direct
  const [importedByIndirectSubsectionCollapsed, setImportedByIndirectSubsectionCollapsed] = useState(true); // Imported By Indirect 기본 접힘
  const resizeRef = useRef<HTMLDivElement>(null);

  const MIN_WIDTH = 180;
  const MAX_WIDTH = 800;

  // 의존성 분석
  const dependencies = useMemo(() => {
    return analyzeDependencies(currentFilePath, graphData);
  }, [currentFilePath, graphData]);

  // Entities를 파일별로 그룹핑
  const entitiesGroupedByFile = useMemo(() => {
    const groups = new Map<string, DependencyItem[]>();
    dependencies.entities.forEach((entity) => {
      if (!groups.has(entity.filePath)) {
        groups.set(entity.filePath, []);
      }
      groups.get(entity.filePath)!.push(entity);
    });
    // 파일 경로순으로 정렬
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [dependencies.entities]);

  // 파일별 collapse toggle
  const toggleFileCollapse = (filePath: string) => {
    setEntityFileCollapseStates((prev) => {
      const newMap = new Map(prev);
      newMap.set(filePath, !prev.get(filePath));
      return newMap;
    });
  };

  // Resize logic (DefinitionPanel과 동일)
  useEffect(() => {
    if (!isResizing) return;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const containerRect = resizeRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;

      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  return (
    <div
      ref={resizeRef}
      className="border-l border-border-DEFAULT bg-bg-elevated flex flex-col flex-shrink-0 relative"
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize group transition-colors ${
          isResizing ? 'bg-warm-300/60' : 'hover:bg-warm-300/30'
        }`}
        onMouseDown={handleResizeStart}
        style={{ zIndex: 10 }}
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-12 rounded-r bg-bg-elevated/80 opacity-0 group-hover:opacity-100 transition-opacity border border-l-0 border-border-DEFAULT">
          <GripVertical size={12} className="text-warm-300" />
        </div>
      </div>

      {/* Header */}
      <div className="flex h-8 items-center justify-between border-b border-border-DEFAULT px-2 flex-shrink-0">
        <span className="text-2xs font-medium text-text-tertiary normal-case">Related Files</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-1">
        {!currentFilePath ? (
          <div className="flex items-center justify-center h-full text-text-tertiary text-xs">
            No file selected
          </div>
        ) : dependencies.localFiles.length === 0 &&
           dependencies.npmModules.length === 0 &&
           dependencies.entities.length === 0 &&
           dependencies.importedBy.length === 0 &&
           dependencies.importedByIndirect.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-tertiary text-xs">
            No dependencies found
          </div>
        ) : (
          <>
            {/* NPM Modules Section (Collapsible) */}
            {dependencies.npmModules.length > 0 && (
              <div>
                <div
                  className="flex items-center gap-1 px-2 py-1 text-3xs font-semibold text-text-faint uppercase tracking-label cursor-pointer hover:bg-bg-deep/50 transition-colors"
                  onClick={() => setNpmSectionCollapsed(!npmSectionCollapsed)}
                >
                  {npmSectionCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  <span>NPM Modules ({dependencies.npmModules.length})</span>
                </div>
                {!npmSectionCollapsed &&
                  dependencies.npmModules.map((item, idx) => (
                    <RelatedPanelItem key={`npm-${item.filePath}-${idx}`} item={item} depth={0} />
                  ))}
              </div>
            )}

            {/* ENTITIES Section (Types/Interfaces) - 파일별 그룹핑 */}
            {dependencies.entities.length > 0 && (
              <div className="mb-2">
                {/* Main ENTITIES Header */}
                <div
                  className="flex items-center gap-1 px-2 py-1 text-3xs font-semibold text-text-faint uppercase tracking-label cursor-pointer hover:bg-bg-deep/50 transition-colors"
                  onClick={() => setEntitiesSectionCollapsed(!entitiesSectionCollapsed)}
                >
                  {entitiesSectionCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  <span>ENTITIES ({dependencies.entities.length})</span>
                </div>

                {!entitiesSectionCollapsed && (
                  <>
                    {/* 파일별 그룹핑 */}
                    {entitiesGroupedByFile.map(([filePath, entities]) => {
                      const fileName = filePath.split('/').pop() || filePath;
                      // src/ 이후 경로만 추출 (상대 경로)
                      const displayPath = filePath.includes('src/')
                        ? filePath.split('src/')[1]
                        : filePath;
                      const isCollapsed = entityFileCollapseStates.get(filePath) ?? false;

                      return (
                        <div key={filePath} className="mb-1">
                          {/* 파일 헤더 */}
                          <div
                            className="flex items-center gap-2 px-2 py-1 text-2xs text-text-tertiary cursor-pointer hover:bg-bg-deep/30 transition-colors"
                            onClick={() => toggleFileCollapse(filePath)}
                            title={filePath}
                          >
                            {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                            <FileIcon fileName={fileName} size={11} className="text-text-tertiary" />
                            <span className="font-medium truncate font-mono">{displayPath}</span>
                            <span className="text-3xs text-text-faint ml-auto shrink-0">({entities.length})</span>
                          </div>

                          {/* Entity 리스트 (flat) */}
                          {!isCollapsed &&
                            entities.map((item, idx) => (
                              <EntityItem
                                key={`entity-${filePath}-${item.exportName}-${idx}`}
                                item={item}
                              />
                            ))}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* Local Files Section */}
            {dependencies.localFiles.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1 text-3xs font-semibold text-text-faint uppercase tracking-label">
                  Local Files ({dependencies.localFiles.length})
                </div>
                {dependencies.localFiles.map((item, idx) => (
                  <RelatedPanelItem key={`local-${item.filePath}-${idx}`} item={item} depth={item.depth} />
                ))}
              </div>
            )}

            {/* Imported By Section (역방향 의존성) - 2 Subsections */}
            {(dependencies.importedBy.length > 0 || dependencies.importedByIndirect.length > 0) && (
              <div className="mb-2">
                {/* Main IMPORTED BY Header */}
                <div
                  className="flex items-center gap-1 px-2 py-1 text-3xs font-semibold text-text-faint uppercase tracking-label cursor-pointer hover:bg-bg-deep/50 transition-colors"
                  onClick={() => setImportedBySectionCollapsed(!importedBySectionCollapsed)}
                >
                  {importedBySectionCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  <span>IMPORTED BY ({dependencies.importedBy.length + dependencies.importedByIndirect.length})</span>
                </div>

                {!importedBySectionCollapsed && (
                  <>
                    {/* Subsection 1: Direct */}
                    {dependencies.importedBy.length > 0 && (
                      <div className="ml-2">
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 text-3xs font-medium text-text-tertiary cursor-pointer hover:bg-bg-deep/30 transition-colors"
                          onClick={() => setImportedByDirectSubsectionCollapsed(!importedByDirectSubsectionCollapsed)}
                        >
                          {importedByDirectSubsectionCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                          <span>📍 Direct ({dependencies.importedBy.length})</span>
                        </div>
                        {!importedByDirectSubsectionCollapsed &&
                          dependencies.importedBy.map((item, idx) => (
                            <RelatedPanelItem
                              key={`importedby-direct-${item.filePath}-${idx}`}
                              item={item}
                              depth={0}
                            />
                          ))}
                      </div>
                    )}

                    {/* Subsection 2: Indirect */}
                    {dependencies.importedByIndirect.length > 0 && (
                      <div className="ml-2">
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 text-3xs font-medium text-text-tertiary cursor-pointer hover:bg-bg-deep/30 transition-colors"
                          onClick={() => setImportedByIndirectSubsectionCollapsed(!importedByIndirectSubsectionCollapsed)}
                        >
                          {importedByIndirectSubsectionCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                          <span>🔗 Indirect ({dependencies.importedByIndirect.length})</span>
                        </div>
                        {!importedByIndirectSubsectionCollapsed &&
                          dependencies.importedByIndirect.map((item, idx) => (
                            <RelatedPanelItem
                              key={`importedby-indirect-${item.filePath}-${idx}`}
                              item={item}
                              depth={item.depth}
                            />
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
