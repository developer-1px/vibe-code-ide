/**
 * CodeDocView - 주석 기반 문서 뷰 (완전 재작성)
 * sample/App.tsx 기반, 기존 tsParser 사용
 */

import { useAtomValue } from 'jotai';
import { Columns3, FileText } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fullNodeMapAtom } from '@/entities/AppView/model/atoms';
import { activeTabAtom, openedTabsAtom } from '@/features/File/OpenFiles/model/atoms';
import { convertToDocData } from '../lib/tsAdapter';
import type { DocData } from '../model/types';
import { DocViewer } from './DocViewer';

type LayoutMode = 'linear' | 'split';

const CodeDocView = () => {
  const openedTabs = useAtomValue(openedTabsAtom);
  const activeTab = useAtomValue(activeTabAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('linear');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 열린 모든 탭의 DocData 생성
  const allDocData: Array<{ filePath: string; docData: DocData }> = useMemo(() => {
    return openedTabs
      .map((filePath) => {
        const node = fullNodeMap.get(filePath);
        if (!node) return null;

        try {
          return { filePath, docData: convertToDocData(node) };
        } catch (error) {
          console.error(`Failed to convert ${filePath} to DocData:`, error);
          return null;
        }
      })
      .filter((item): item is { filePath: string; docData: DocData } => item !== null);
  }, [openedTabs, fullNodeMap]);

  // ==========================================
  // UI 반응 로직: activeTab 변경에 따른 스크롤
  // ==========================================
  // Feature 레이어의 activeTabAtom이 변경되면,
  // CodeDocView는 해당 문서로 스크롤하여 시각적 피드백 제공
  useEffect(() => {
    if (activeTab && scrollContainerRef.current) {
      const targetElement = document.getElementById(`doc-${activeTab}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [activeTab]);

  function handleLayoutModeClick() {
    setLayoutMode((prev) => (prev === 'linear' ? 'split' : 'linear'));
  }

  // 파일이 없을 때
  if (allDocData.length === 0) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-bg-elevated text-text-tertiary">
        <div className="text-center">
          <FileText size={40} className="mx-auto mb-4 text-gray-300" aria-hidden="true" />
          <p className="text-sm">No files open. Use search (Shift+Shift) or click a file in the sidebar to open.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 min-h-0 bg-gray-50 overflow-hidden">
      {/* Top Control Bar */}
      <div className="absolute top-6 right-8 z-50 print:hidden">
        <button
          onClick={handleLayoutModeClick}
          className="p-2 rounded-lg bg-bg-deep border border-border shadow-sm text-text-secondary hover:text-text-primary transition-colors"
          title={layoutMode === 'linear' ? 'Annotated Layout' : 'Standard Layout'}
        >
          {layoutMode === 'linear' ? (
            <Columns3 size={18} aria-hidden="true" />
          ) : (
            <FileText size={18} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Content Area - Centered */}
      <div
        ref={scrollContainerRef}
        className="absolute inset-0 min-h-0 flex items-start justify-center overflow-y-auto custom-scrollbar"
      >
        <div className="w-full max-w-7xl p-6 md:p-12">
          {allDocData.map(({ filePath, docData }, index) => (
            <div
              key={filePath}
              id={`doc-${filePath}`}
              className={`mx-auto min-h-[900px] transition-all duration-300 ${
                layoutMode === 'split' ? 'max-w-full' : 'max-w-4xl px-12 py-16'
              } ${index > 0 ? 'mt-12' : ''}`}
            >
              <DocViewer data={docData} layout={layoutMode} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CodeDocView;
