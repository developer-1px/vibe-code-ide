/**
 * IDEScrollView - 열린 파일들을 세로 스크롤로 한번에 볼 수 있는 통합 뷰
 */

import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { filesAtom, fullNodeMapAtom } from '@/entities/AppView/model/atoms';
import { activeTabAtom, openedTabsAtom } from '@/features/File/OpenFiles/model/atoms.ts';
import { useScrollNavigation } from '@/shared/hooks/useScrollNavigation.ts';
import FileSection from './FileSection.tsx';

const IDEScrollView = () => {
  const openedTabs = useAtomValue(openedTabsAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const files = useAtomValue(filesAtom);
  const activeTab = useAtomValue(activeTabAtom);
  const displayFilePaths = openedTabs;

  // ==========================================
  // UI 반응 로직: activeTab 변경에 따른 스크롤
  // ==========================================
  // Feature 레이어의 activeTabAtom이 변경되면,
  // Widget은 해당 파일 섹션으로 스크롤하여 시각적 피드백 제공
  const { registerSection, scrollToFile } = useScrollNavigation(displayFilePaths);

  useEffect(() => {
    if (activeTab && displayFilePaths.includes(activeTab)) {
      scrollToFile(activeTab);
    }
  }, [activeTab, scrollToFile, displayFilePaths]);

  // 표시할 파일이 없을 때
  if (displayFilePaths.length === 0) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-bg-elevated text-text-tertiary">
        <p className="text-sm">No files open. Use search (Shift+Shift) or click a file in the sidebar to open.</p>
      </div>
    );
  }

  return (
    <div id="scroll-view-container" className="flex-1 min-h-0 h-full overflow-y-auto bg-bg-elevated">
      {displayFilePaths.map((filePath) => {
        const node = fullNodeMap.get(filePath);
        if (!node) return null;

        return (
          <FileSection
            key={filePath}
            ref={(el) => registerSection(filePath, el)}
            node={node}
            files={files}
            highlightedLines={new Set<number>()}
          />
        );
      })}
    </div>
  );
};

export default IDEScrollView;
