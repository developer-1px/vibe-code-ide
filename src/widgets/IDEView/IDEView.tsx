/**
 * IDEView - IDE-style full-screen code viewer with tab system
 * Shows files in tabs like a traditional IDE
 */

import React, { useMemo, useEffect } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useHotkeys } from 'react-hotkeys-hook';
import { X, FileText } from 'lucide-react';
import { openedTabsAtom, activeTabAtom, viewModeAtom, fullNodeMapAtom, filesAtom } from '../../store/atoms';
import { renderCodeLinesDirect } from '../CodeViewer/core/renderer/renderCodeLinesDirect';
import { renderVueFile } from '../CodeViewer/core/renderer/renderVueFile';
import CodeViewer from '../CodeViewer/CodeViewer';
import { getFileName } from '../../shared/pathUtils';

const IDEView = () => {
  const [openedTabs, setOpenedTabs] = useAtom(openedTabsAtom);
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const files = useAtomValue(filesAtom);
  const setViewMode = useSetAtom(viewModeAtom);

  // Sync activeTab when it changes
  const activeNode = activeTab ? fullNodeMap.get(activeTab) : null;

  // If no active tab but tabs exist, activate the first one
  useEffect(() => {
    if (!activeTab && openedTabs.length > 0) {
      setActiveTab(openedTabs[0]);
    }
  }, [activeTab, openedTabs, setActiveTab]);

  // Go back to canvas view
  const handleBackToCanvas = () => {
    setViewMode('canvas');
  };

  // ESC key to go back to canvas
  useHotkeys('esc', handleBackToCanvas, { enableOnFormTags: true });

  // Close tab
  const handleCloseTab = (e: React.MouseEvent, tabPath: string) => {
    e.stopPropagation();

    const tabIndex = openedTabs.indexOf(tabPath);
    const newTabs = openedTabs.filter(t => t !== tabPath);

    setOpenedTabs(newTabs);

    // If closing active tab, switch to adjacent tab
    if (tabPath === activeTab) {
      if (newTabs.length > 0) {
        // Switch to the tab on the right, or left if it was the last tab
        const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
        setActiveTab(newTabs[newActiveIndex]);
      } else {
        setActiveTab(null);
      }
    }
  };

  // Process code lines
  const processedLines = useMemo(() => {
    if (!activeNode) return [];

    if (activeNode.filePath.endsWith('.vue')) {
      return renderVueFile(activeNode, files);
    }
    return renderCodeLinesDirect(activeNode, files);
  }, [activeNode, files]);

  if (!activeNode && openedTabs.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-vibe-panel text-slate-400">
        <p>No files open. Use search (Shift+Shift) or click a file in the sidebar to open.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-vibe-panel overflow-hidden">
      {/* Tab Bar */}
      <div className="flex-none border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-0 overflow-x-auto">
          {openedTabs.map((tabPath) => {
            const tabNode = fullNodeMap.get(tabPath);
            if (!tabNode) return null;

            const fileName = getFileName(tabNode.filePath);
            const isActive = tabPath === activeTab;

            return (
              <div
                key={tabPath}
                onClick={() => setActiveTab(tabPath)}
                className={`
                  group relative flex items-center gap-2 px-3 py-2 cursor-pointer
                  border-r border-white/10 transition-colors select-none
                  ${isActive
                    ? 'bg-vibe-panel text-slate-100'
                    : 'bg-black/20 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }
                `}
              >
                <FileText className="w-3 h-3 flex-shrink-0" />
                <span className="text-[11px] font-mono font-medium whitespace-nowrap">
                  {fileName}
                </span>

                {/* Close button */}
                <button
                  onClick={(e) => handleCloseTab(e, tabPath)}
                  className={`
                    ml-1 p-0.5 rounded transition-colors
                    ${isActive
                      ? 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
                      : 'text-slate-500 hover:bg-white/10 hover:text-slate-200 opacity-0 group-hover:opacity-100'
                    }
                  `}
                  title="Close tab (Cmd+W)"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-vibe-accent" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable code content */}
      <div className="flex-1 overflow-y-auto">
        {activeNode && (
          <CodeViewer
            processedLines={processedLines}
            node={activeNode}
          />
        )}
      </div>
    </div>
  );
};

export default IDEView;
